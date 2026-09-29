import "dotenv/config";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import axios from "axios";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { Prisma, PrismaClient } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 5000);
const apiPrefix = "/api/v1";
const maxDocumentBytes = Number(process.env.MAX_DOCUMENT_BYTES || 15 * 1024 * 1024);
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxDocumentBytes, files: 1 } });
const limiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:3001").split(","), credentials: true }));
app.use(express.json({ limit: "128kb" }));

function sha256(value: Buffer | string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function mediaTypeOf(data: Buffer): string | null {
  if (data.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/)) return "image/gif";
  return null;
}

function requestCompanyId(req: Request): string | null {
  const secret = process.env.JWT_SECRET;
  const cookie = req.header("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("acadshield_session="))?.slice("acadshield_session=".length);
  const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? cookie;
  if (!secret || secret.length < 32 || !token) return null;
  try {
    const claims = jwt.verify(token, secret, { issuer: "acadshield-core" }) as jwt.JwtPayload;
    return claims.role === "COMPANY" && typeof claims.companyId === "string" ? claims.companyId : null;
  } catch {
    return null;
  }
}

async function authenticateCompany(req: Request, res: Response, scope: string): Promise<{ companyId: string; apiKeyId?: string } | null> {
  const sessionCompanyId = requestCompanyId(req);
  const hasSessionCookie = req.header("cookie")?.includes("acadshield_session=") ?? false;
  if (sessionCompanyId) {
    if (hasSessionCookie && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3001").split(",").map((origin) => origin.trim());
      if (!req.header("origin") || !allowedOrigins.includes(req.header("origin")!)) {
        res.status(403).json({ error: "INVALID_REQUEST_ORIGIN" });
        return null;
      }
    }
    return { companyId: sessionCompanyId };
  }

  const rawKey = req.header("x-api-key");
  if (!rawKey) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return null;
  }
  const keyHash = sha256(rawKey);
  const row = await prisma.companyApiKey.findUnique({ where: { tokenHash: keyHash } });
  if (!row || row.status !== "ACTIVE" || (row.expiresAt && row.expiresAt <= new Date())) {
    res.status(401).json({ error: "INVALID_API_KEY" });
    return null;
  }
  if (!row.scopes.includes(scope)) {
    res.status(403).json({ error: "INSUFFICIENT_API_KEY_SCOPE", requiredScope: scope });
    return null;
  }
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  if (row.quotaResetAt < startOfDay) {
    await prisma.companyApiKey.updateMany({ where: { id: row.id, quotaResetAt: { lt: startOfDay } }, data: { usedToday: 0, quotaResetAt: startOfDay } });
  } else if (row.usedToday >= row.dailyQuota) {
    res.status(429).json({ error: "DAILY_QUOTA_EXCEEDED", dailyQuota: row.dailyQuota });
    return null;
  }
  const consumed = await prisma.companyApiKey.updateMany({
    where: { id: row.id, status: "ACTIVE", usedToday: { lt: row.dailyQuota } },
    data: { usedToday: { increment: 1 }, lastUsedAt: new Date() },
  });
  if (consumed.count !== 1) {
    res.status(429).json({ error: "DAILY_QUOTA_EXCEEDED", dailyQuota: row.dailyQuota });
    return null;
  }
  return { companyId: row.companyId, apiKeyId: row.id };
}

app.get("/health", (_req, res) => res.json({ status: "UP", service: "acadshield-trust-api" }));
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "READY", database: "AVAILABLE" });
  } catch {
    res.status(503).json({ status: "NOT_READY", database: "UNAVAILABLE" });
  }
});

app.post(`${apiPrefix}/verify/credential`, limiter, upload.single("file"), async (req, res, next) => {
  try {
    const company = await authenticateCompany(req, res, "credential:verify");
    if (!company) return;
    const credentialId = req.body?.credentialId;
    if (typeof credentialId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(credentialId) || !req.file) {
      res.status(400).json({ error: "CREDENTIAL_ID_AND_FILE_REQUIRED" });
      return;
    }
    const mediaType = mediaTypeOf(req.file.buffer);
    if (!mediaType) {
      res.status(415).json({ error: "UNSUPPORTED_OR_INVALID_FILE_SIGNATURE" });
      return;
    }
    const documentSha256 = sha256(req.file.buffer);
    const coreUrl = process.env.PROJECT_A_API_URL;
    const coreKey = process.env.PROJECT_A_INTERNAL_API_KEY;
    if (!coreUrl || !coreKey) {
      res.status(503).json({ error: "CREDENTIAL_PROVIDER_NOT_CONFIGURED", decision: "SOURCE_UNAVAILABLE" });
      return;
    }
    let source: Record<string, unknown>;
    try {
      const response = await axios.post(
        `${coreUrl.replace(/\/$/, "")}/internal/verify-credential`,
        { credentialId, documentSha256 },
        { headers: { "X-API-Key": coreKey }, timeout: Number(process.env.PROJECT_A_TIMEOUT_MS || 4000) },
      );
      source = response.data as Record<string, unknown>;
    } catch (error) {
      const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined;
      if (statusCode === 404) {
        source = { decision: "INVALID", sourceStatus: "NOT_FOUND", evidence: { error: "CREDENTIAL_NOT_FOUND" } };
      } else {
        source = { decision: "SOURCE_UNAVAILABLE", sourceStatus: "UNAVAILABLE", evidence: { error: "CORE_PROVIDER_UNAVAILABLE" } };
      }
    }

    let ai: Record<string, unknown> = { status: "UNAVAILABLE", reason: "AI_SERVICE_NOT_CONFIGURED" };
    if (process.env.AI_SERVICE_URL && process.env.AI_SERVICE_API_KEY) {
      try {
        const decision = String(source.decision || "SOURCE_UNAVAILABLE");
        const signals = ["MISMATCH", "INVALID", "REVOKED", "EXPIRED"].includes(decision)
          ? [{ type: `DETERMINISTIC_${decision}`, severity: "HIGH", source: "Core credential verifier" }]
          : [];
        const response = await axios.post(
          `${process.env.AI_SERVICE_URL.replace(/\/$/, "")}/api/v1/risk-score`,
          { signals, source_status: source.sourceStatus || "NOT_CHECKED", credential_status: decision },
          { headers: { "X-API-Key": process.env.AI_SERVICE_API_KEY }, timeout: Number(process.env.AI_SERVICE_TIMEOUT_MS || 3000) },
        );
        ai = response.data as Record<string, unknown>;
      } catch {
        ai = { status: "UNAVAILABLE", reason: "AI_SERVICE_REQUEST_FAILED" };
      }
    }

    const decision = String(source.decision || "SOURCE_UNAVAILABLE");
    const verification = await prisma.verificationRecord.create({
      data: {
        companyId: company.companyId,
        apiKeyId: company.apiKeyId,
        credentialId,
        decision,
        submittedSha256: documentSha256,
        sourceEvidence: source as Prisma.InputJsonValue,
        aiEvidence: ai as Prisma.InputJsonValue,
      },
    });
    res.status(201).json({
      verificationId: verification.id,
      credentialId,
      decision,
      document: { mediaType, sizeBytes: req.file.size, sha256: documentSha256, hashAlgorithm: "SHA-256" },
      sourceVerification: source,
      aiAnalysis: ai,
      note: "AI evidence cannot override cryptographic, issuer, source, lifecycle, or blockchain results.",
    });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/verifications`, async (req, res, next) => {
  try {
    const company = await authenticateCompany(req, res, "verification:read");
    if (!company) return;
    const rows = await prisma.verificationRecord.findMany({ where: { companyId: company.companyId }, orderBy: { createdAt: "desc" }, take: 100 });
    res.json({ verifications: rows });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "DOCUMENT_TOO_LARGE", maxBytes: maxDocumentBytes });
    return;
  }
  console.error("Trust API request failed", error instanceof Error ? error.name : "unknown error");
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

if (require.main === module) {
  const server = app.listen(port, () => console.log(`AcadShield Trust API listening on ${port}`));
  async function shutdown(): Promise<void> {
    server.close();
    await prisma.$disconnect();
  }
  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

export { app };
