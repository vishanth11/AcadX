import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import express, { NextFunction, Request, Response } from "express";
import helmet from "helmet";
import cors from "cors";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from "ethers";
import QRCode from "qrcode";
import { Prisma, PrismaClient } from "@prisma/client";
import { decideVerification } from "./verification-decision";
import { compareHolderDocuments } from "./cross-document";
import { configuredSourceProvider } from "./providers/source-provider";

const app = express();
const prisma = new PrismaClient();
const port = Number(process.env.PORT || 4000);
const apiPrefix = "/api/v1";
const maxDocumentBytes = Number(process.env.MAX_DOCUMENT_BYTES || 15 * 1024 * 1024);
const storageRoot = path.resolve(process.env.DOCUMENT_STORAGE_DIR || "storage/documents");

app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: (process.env.CORS_ORIGIN || "http://localhost:3000").split(","), credentials: true }));
app.use(express.json({ limit: "256kb" }));

type SessionRole = "ADMIN" | "UNIVERSITY" | "COMPANY" | "STUDENT";
type SessionRequest = Request & { session?: { userId: string; role: SessionRole; institutionId?: string; companyId?: string } };
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxDocumentBytes, files: 1 } });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });
const registrationLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: true, legacyHeaders: false });
const uploadLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 60, standardHeaders: true, legacyHeaders: false });
const blockchainAbi = [
  "function ISSUER_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function mintCredential(address recipient, bytes32 credentialRef, bytes32 documentSha256, string metadataURI) returns (uint256)",
  "function revokeCredential(bytes32 credentialRef)",
  "function tokenForCredential(bytes32 credentialRef) view returns (uint256)",
  "function records(uint256 tokenId) view returns (bytes32 documentSha256, bytes32 credentialRef, bool revoked, uint64 issuedAt)",
  "function isCredentialValid(bytes32 credentialRef, bytes32 documentSha256) view returns (bool)",
  "event CredentialMinted(bytes32 indexed credentialRef, uint256 indexed tokenId, address indexed recipient, bytes32 documentSha256, string metadataURI)",
  "event CredentialRevoked(bytes32 indexed credentialRef, uint256 indexed tokenId, address indexed issuer)",
];

type BlockchainConfig = { rpcUrl: string; chainId: bigint; contractAddress: string; privateKey: string; recipientAddress: string };

function blockchainConfig(): BlockchainConfig | null {
  const { BLOCKCHAIN_RPC_URL, CHAIN_ID, CREDENTIAL_CONTRACT_ADDRESS, BLOCKCHAIN_ISSUER_PRIVATE_KEY, BLOCKCHAIN_RECIPIENT_ADDRESS } = process.env;
  if (!BLOCKCHAIN_RPC_URL || !CHAIN_ID || !CREDENTIAL_CONTRACT_ADDRESS || !BLOCKCHAIN_ISSUER_PRIVATE_KEY || !BLOCKCHAIN_RECIPIENT_ADDRESS) return null;
  if (!/^0x[0-9a-f]{40}$/i.test(CREDENTIAL_CONTRACT_ADDRESS) || !/^0x[0-9a-f]{40}$/i.test(BLOCKCHAIN_RECIPIENT_ADDRESS)) return null;
  if (!/^0x[0-9a-f]{64}$/i.test(BLOCKCHAIN_ISSUER_PRIVATE_KEY) || !/^\d+$/.test(CHAIN_ID)) return null;
  return { rpcUrl: BLOCKCHAIN_RPC_URL, chainId: BigInt(CHAIN_ID), contractAddress: CREDENTIAL_CONTRACT_ADDRESS, privateKey: BLOCKCHAIN_ISSUER_PRIVATE_KEY, recipientAddress: BLOCKCHAIN_RECIPIENT_ADDRESS };
}

async function blockchainProvider(config: BlockchainConfig): Promise<JsonRpcProvider> {
  const provider = new JsonRpcProvider(config.rpcUrl, config.chainId);
  const network = await provider.getNetwork();
  if (network.chainId !== config.chainId) throw new Error("BLOCKCHAIN_NETWORK_MISMATCH");
  return provider;
}

function credentialReference(credentialId: string): string {
  return keccak256(toUtf8Bytes(credentialId));
}

async function uploadPublicCredentialMetadata(credentialId: string, metadata: object): Promise<{ cid: string; uri: string } | null> {
  if ((process.env.IPFS_STORAGE_MODE || "disabled").toLowerCase() !== "pinata") return null;
  const token = process.env.IPFS_JWT;
  if (!token) throw new Error("IPFS_PINATA_NOT_CONFIGURED");
  const form = new FormData();
  form.set("network", "public");
  form.set("name", `acadshield-credential-${credentialId}.json`);
  form.set("cid_version", "v1");
  form.set("file", new Blob([JSON.stringify(metadata)], { type: "application/json" }), `acadshield-credential-${credentialId}.json`);
  const response = await fetch("https://uploads.pinata.cloud/v3/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!response.ok) throw new Error("IPFS_PINATA_UPLOAD_FAILED");
  const result = await response.json() as { data?: { cid?: string } };
  const cid = result.data?.cid;
  if (!cid || !/^[A-Za-z0-9]{20,120}$/.test(cid)) throw new Error("IPFS_PINATA_INVALID_RESPONSE");
  return { cid, uri: `ipfs://${cid}` };
}

async function verifyOnChain(record: { id: string; chainId: number | null; contractAddress: string | null; tokenId: string | null; transactionHash: string | null; document?: { documentSha256: string } | null }): Promise<"NOT_RECORDED" | "NOT_CONFIGURED" | "UNAVAILABLE" | "MISMATCH" | "REVOKED" | "VERIFIED"> {
  if (!record.transactionHash) return "NOT_RECORDED";
  const config = blockchainConfig();
  if (!config) return "NOT_CONFIGURED";
  if (!record.tokenId || record.chainId !== Number(config.chainId) || record.contractAddress?.toLowerCase() !== config.contractAddress.toLowerCase() || !record.document) return "MISMATCH";
  try {
    const provider = await blockchainProvider(config);
    const contract = new Contract(config.contractAddress, blockchainAbi, provider);
    const reference = credentialReference(record.id);
    const tokenId = BigInt(record.tokenId);
    const onChainTokenId = BigInt(await contract.tokenForCredential(reference));
    const onChainRecord = await contract.records(tokenId);
    const receipt = await provider.getTransactionReceipt(record.transactionHash);
    const matchingMintEvent = receipt?.logs.some((log) => {
      if (log.address.toLowerCase() !== config.contractAddress.toLowerCase()) return false;
      try {
        const event = contract.interface.parseLog(log);
        return event?.name === "CredentialMinted" && BigInt(event.args.tokenId) === tokenId && String(event.args.credentialRef).toLowerCase() === reference.toLowerCase() && String(event.args.documentSha256).toLowerCase() === `0x${record.document!.documentSha256}`.toLowerCase();
      } catch { return false; }
    });
    if (onChainTokenId !== tokenId || String(onChainRecord.credentialRef).toLowerCase() !== reference.toLowerCase() || String(onChainRecord.documentSha256).toLowerCase() !== `0x${record.document.documentSha256}`.toLowerCase() || !receipt || receipt.status !== 1 || !matchingMintEvent) return "MISMATCH";
    if (onChainRecord.revoked) return "REVOKED";
    return await contract.isCredentialValid(reference, `0x${record.document.documentSha256}`) ? "VERIFIED" : "MISMATCH";
  } catch {
    return "UNAVAILABLE";
  }
}

function configuredJwtSecret(): string | undefined {
  const secret = process.env.JWT_SECRET;
  return secret && secret.length >= 32 ? secret : undefined;
}

function requireSession(...roles: SessionRole[]) {
  return (req: SessionRequest, res: Response, next: NextFunction): void => {
    const secret = configuredJwtSecret();
    if (!secret) {
      res.status(503).json({ error: "AUTHENTICATION_NOT_CONFIGURED" });
      return;
    }
    const cookieToken = req.header("cookie")?.split(";").map((part) => part.trim()).find((part) => part.startsWith("acadshield_session="))?.slice("acadshield_session=".length);
    if (cookieToken && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:3000").split(",").map((origin) => origin.trim());
      if (!req.header("origin") || !allowedOrigins.includes(req.header("origin")!)) {
        res.status(403).json({ error: "INVALID_REQUEST_ORIGIN" });
        return;
      }
    }
    const token = req.header("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1] ?? cookieToken;
    if (!token) {
      res.status(401).json({ error: "UNAUTHORIZED" });
      return;
    }
    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;
      const role = payload.role as SessionRole;
      if (typeof payload.sub !== "string" || !["ADMIN", "UNIVERSITY", "COMPANY", "STUDENT"].includes(role)) {
        res.status(401).json({ error: "INVALID_SESSION" });
        return;
      }
      if (roles.length && !roles.includes(role)) {
        res.status(403).json({ error: "FORBIDDEN" });
        return;
      }
      req.session = { userId: payload.sub, role, institutionId: payload.institutionId, companyId: payload.companyId };
      next();
    } catch {
      res.status(401).json({ error: "INVALID_SESSION" });
    }
  };
}

function detectMediaType(data: Buffer): string | null {
  if (data.subarray(0, 5).toString("ascii") === "%PDF-") return "application/pdf";
  if (data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.subarray(0, 6).toString("ascii").match(/^GIF8[79]a$/)) return "image/gif";
  return null;
}

function sha256(data: Buffer | string): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

function pemValue(value: string | undefined): string | undefined {
  return value?.replace(/\\n/g, "\n");
}

function verifyCredentialJws(token: string | null, expectedIssuer: string): "VERIFIED" | "MISSING" | "INVALID" | "NOT_CONFIGURED" {
  const publicKey = pemValue(process.env.VC_ISSUER_PUBLIC_KEY_PEM);
  if (!token) return "MISSING";
  if (!publicKey) return "NOT_CONFIGURED";
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ["ES256"], issuer: expectedIssuer }) as jwt.JwtPayload;
    const header = jwt.decode(token, { complete: true })?.header;
    if (header?.kid !== process.env.VC_ISSUER_KEY_ID || typeof decoded.jti !== "string") return "INVALID";
    return "VERIFIED";
  } catch {
    return "INVALID";
  }
}

app.get("/health", (_req, res) => res.json({ status: "UP", service: "acadshield-core-api" }));
app.get("/ready", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "READY", database: "AVAILABLE" });
  } catch {
    res.status(503).json({ status: "NOT_READY", database: "UNAVAILABLE" });
  }
});

app.get(`${apiPrefix}/admin/overview`, requireSession("ADMIN"), async (_req, res, next) => {
  try {
    const [institutions, companies, documents, credentials, verifications] = await Promise.all([
      prisma.institution.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.company.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.academicDocument.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.credential.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.verification.groupBy({ by: ["decision"], _count: { _all: true } }),
    ]);
    const counts = (rows: Array<{ status?: string; decision?: string; _count: { _all: number } }>) => Object.fromEntries(rows.map((row) => [row.status ?? row.decision ?? "UNKNOWN", row._count._all]));
    res.json({ generatedAt: new Date().toISOString(), institutions: counts(institutions), companies: counts(companies), documents: counts(documents), credentials: counts(credentials), verifications: counts(verifications) });
  } catch (error) { next(error); }
});

app.get(`${apiPrefix}/admin/blockchain`, requireSession("ADMIN"), async (_req, res, next) => {
  try {
    const config = blockchainConfig();
    const rows = await prisma.credential.findMany({
      where: { transactionHash: { not: null } },
      include: { document: { select: { documentSha256: true } } },
      orderBy: { mintedAt: "desc" },
      take: 50,
    });
    const receipts = await Promise.all(rows.map(async (row) => ({
      credentialId: row.id,
      status: row.status,
      chainId: row.chainId,
      contractAddress: row.contractAddress,
      tokenId: row.tokenId,
      transactionHash: row.transactionHash,
      blockNumber: row.blockNumber?.toString() ?? null,
      mintedAt: row.mintedAt,
      chainEvidence: await verifyOnChain(row),
    })));
    res.json({
      generatedAt: new Date().toISOString(),
      writeIntegrationConfigured: Boolean(config),
      configuredChainId: config?.chainId.toString() ?? null,
      configuredContractAddress: config?.contractAddress ?? null,
      rpcConfigured: Boolean(process.env.BLOCKCHAIN_RPC_URL && process.env.CHAIN_ID),
      storedReceiptCount: rows.length,
      receipts,
      note: "Only stored mint receipts are listed. Chain evidence is independently read when a fully configured RPC integration is available.",
    });
  } catch (error) { next(error); }
});

app.get(`${apiPrefix}/admin/audit`, requireSession("ADMIN"), async (req, res, next) => {
  const limit = Math.min(200, Math.max(1, Number.parseInt(String(req.query.limit ?? "100"), 10) || 100));
  try {
    const rows = await prisma.auditLog.findMany({
      include: { actor: { select: { email: true, role: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    res.json({ entries: rows.map((row) => ({ ...row, id: row.id.toString(), actor: row.actor ? { email: row.actor.email, role: row.actor.role } : null })), limit, tamperEvidence: "DATABASE_AUDIT_ROWS_ONLY" });
  } catch (error) { next(error); }
});

app.get(`${apiPrefix}/admin/institutions`, requireSession("ADMIN"), async (_req, res, next) => {
  try {
    const institutions = await prisma.institution.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        code: true,
        country: true,
        website: true,
        status: true,
        createdAt: true,
        users: { select: { id: true, email: true, role: true, status: true } },
        _count: { select: { users: true, documents: true, credentials: true } },
      },
    });
    res.json({ institutions });
  } catch (error) { next(error); }
});

app.get(`${apiPrefix}/admin/companies`, requireSession("ADMIN"), async (_req, res, next) => {
  try {
    const companies = await prisma.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true,
        name: true,
        domain: true,
        status: true,
        createdAt: true,
        users: { select: { id: true, email: true, role: true, status: true } },
        _count: { select: { users: true, verifications: true } },
      },
    });
    res.json({ companies });
  } catch (error) { next(error); }
});

app.post(`${apiPrefix}/companies/register`, registrationLimiter, async (req, res, next) => {
  const parsed = z.object({
    name: z.string().trim().min(2).max(200),
    domain: z.string().trim().min(2).max(254).optional(),
    administratorEmail: z.string().email().max(254),
    initialPassword: z.string().min(16).max(200),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_COMPANY_REQUEST", details: parsed.error.flatten() });
    return;
  }
  try {
    const email = parsed.data.administratorEmail.toLowerCase();
    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existingUser) {
      res.status(409).json({ error: "COMPANY_OR_EMAIL_ALREADY_EXISTS" });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.initialPassword, 12);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: parsed.data.name, domain: parsed.data.domain, status: "PENDING" } });
      const user = await tx.user.create({ data: { email, passwordHash, role: "COMPANY", status: "PENDING", companyId: company.id } });
      await tx.auditLog.create({ data: { action: "COMPANY_APPLICATION_SUBMITTED", entityType: "Company", entityId: company.id, details: { initialUserId: user.id, domain: parsed.data.domain ?? null } } });
      return { company, user };
    });
    res.status(201).json({ companyId: result.company.id, status: result.company.status, administrator: { id: result.user.id, email: result.user.email, status: result.user.status } });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/auth/login`, loginLimiter, async (req, res, next) => {
  const parsed = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_LOGIN_REQUEST" });
    return;
  }
  const secret = configuredJwtSecret();
  if (!secret) {
    res.status(503).json({ error: "AUTHENTICATION_NOT_CONFIGURED" });
    return;
  }
  try {
    const user = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
    const passwordMatches = user ? await bcrypt.compare(parsed.data.password, user.passwordHash) : false;
    if (!user || !passwordMatches || user.status !== "ACTIVE") {
      res.status(401).json({ error: "INVALID_CREDENTIALS" });
      return;
    }
    const token = jwt.sign(
      { role: user.role, institutionId: user.institutionId, companyId: user.companyId },
      secret,
      { subject: user.id, expiresIn: "15m", issuer: "acadshield-core" },
    );
    res.cookie("acadshield_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });
    res.json({ expiresIn: "15m", user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/institutions/register`, registrationLimiter, async (req, res, next) => {
  const parsed = z.object({
    name: z.string().trim().min(3).max(200),
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/),
    country: z.string().trim().max(100).optional(),
    website: z.string().url().max(500).optional(),
    adminEmail: z.string().email().max(254),
    initialPassword: z.string().min(16).max(200),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_INSTITUTION_REQUEST", details: parsed.error.flatten() });
    return;
  }
  try {
    const email = parsed.data.adminEmail.toLowerCase();
    const [existingUser, existingInstitution] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      prisma.institution.findUnique({ where: { code: parsed.data.code }, select: { id: true } }),
    ]);
    if (existingUser || existingInstitution) {
      res.status(409).json({ error: "INSTITUTION_OR_EMAIL_ALREADY_EXISTS" });
      return;
    }
    const passwordHash = await bcrypt.hash(parsed.data.initialPassword, 12);
    const created = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: { name: parsed.data.name, code: parsed.data.code, country: parsed.data.country, website: parsed.data.website, status: "PENDING" },
      });
      const user = await tx.user.create({
        data: { email, passwordHash, role: "UNIVERSITY", status: "PENDING", institutionId: institution.id },
      });
      await tx.auditLog.create({ data: { action: "INSTITUTION_APPLICATION_SUBMITTED", entityType: "Institution", entityId: institution.id, details: { institutionCode: institution.code, initialUserId: user.id } } });
      return { institution, user };
    });
    res.status(201).json({ institutionId: created.institution.id, status: created.institution.status, administrator: { id: created.user.id, email: created.user.email, status: created.user.status } });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/auth/logout`, (_req, res) => {
  res.clearCookie("acadshield_session", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/" });
  res.status(204).end();
});

app.post(`${apiPrefix}/admin/institutions`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const parsed = z.object({
    name: z.string().trim().min(3).max(200),
    code: z.string().trim().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/),
    country: z.string().trim().max(100).optional(),
    website: z.string().url().max(500).optional(),
    adminEmail: z.string().email().max(254),
    initialPassword: z.string().min(16).max(200),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_INSTITUTION_REQUEST", details: parsed.error.flatten() });
    return;
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.initialPassword, 12);
    const created = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.create({
        data: { name: parsed.data.name, code: parsed.data.code, country: parsed.data.country, website: parsed.data.website, status: "PENDING" },
      });
      const user = await tx.user.create({
        data: { email: parsed.data.adminEmail.toLowerCase(), passwordHash, role: "UNIVERSITY", status: "PENDING", institutionId: institution.id },
      });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "INSTITUTION_REGISTERED", entityType: "Institution", entityId: institution.id, details: { institutionCode: institution.code, initialUserId: user.id } } });
      return { institution, user };
    });
    res.status(201).json({ institutionId: created.institution.id, status: created.institution.status, administrator: { id: created.user.id, email: created.user.email, status: created.user.status } });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/admin/institutions/:institutionId/activate`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const { institutionId } = req.params;
  if (!uuidPattern.test(institutionId)) {
    res.status(404).json({ error: "INSTITUTION_NOT_FOUND" });
    return;
  }
  try {
    const activated = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.update({ where: { id: institutionId }, data: { status: "ACTIVE" } });
      await tx.user.updateMany({ where: { institutionId, role: "UNIVERSITY", status: "PENDING" }, data: { status: "ACTIVE" } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "INSTITUTION_ACTIVATED", entityType: "Institution", entityId: institution.id } });
      return institution;
    });
    res.json({ institutionId: activated.id, status: activated.status, issuerSigningConfigured: process.env.VC_ISSUER_INSTITUTION_ID === activated.id && Boolean(process.env.VC_ISSUER_PRIVATE_KEY_PEM) });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/admin/institutions/:institutionId/suspend`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const { institutionId } = req.params;
  if (!uuidPattern.test(institutionId)) {
    res.status(404).json({ error: "INSTITUTION_NOT_FOUND" });
    return;
  }
  try {
    const suspended = await prisma.$transaction(async (tx) => {
      const institution = await tx.institution.update({ where: { id: institutionId }, data: { status: "SUSPENDED" } });
      await tx.user.updateMany({ where: { institutionId, role: "UNIVERSITY" }, data: { status: "SUSPENDED" } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "INSTITUTION_SUSPENDED", entityType: "Institution", entityId: institution.id } });
      return institution;
    });
    res.json({ institutionId: suspended.id, status: suspended.status });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/admin/companies`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const parsed = z.object({
    name: z.string().trim().min(2).max(200),
    domain: z.string().trim().max(254).optional(),
    administratorEmail: z.string().email().max(254),
    initialPassword: z.string().min(16).max(200),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_COMPANY_REQUEST", details: parsed.error.flatten() });
    return;
  }
  try {
    const passwordHash = await bcrypt.hash(parsed.data.initialPassword, 12);
    const result = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({ data: { name: parsed.data.name, domain: parsed.data.domain, status: "PENDING" } });
      const user = await tx.user.create({ data: { email: parsed.data.administratorEmail.toLowerCase(), passwordHash, role: "COMPANY", status: "PENDING", companyId: company.id } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "COMPANY_REGISTERED", entityType: "Company", entityId: company.id, details: { initialUserId: user.id } } });
      return { company, user };
    });
    res.status(201).json({ companyId: result.company.id, status: result.company.status, administrator: { id: result.user.id, email: result.user.email, status: result.user.status } });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/admin/companies/:companyId/activate`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const { companyId } = req.params;
  if (!uuidPattern.test(companyId)) {
    res.status(404).json({ error: "COMPANY_NOT_FOUND" });
    return;
  }
  try {
    const activated = await prisma.$transaction(async (tx) => {
      const company = await tx.company.update({ where: { id: companyId }, data: { status: "ACTIVE" } });
      await tx.user.updateMany({ where: { companyId, role: "COMPANY", status: "PENDING" }, data: { status: "ACTIVE" } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "COMPANY_ACTIVATED", entityType: "Company", entityId: company.id } });
      return company;
    });
    res.json({ companyId: activated.id, status: activated.status });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/admin/companies/:companyId/suspend`, requireSession("ADMIN"), async (req: SessionRequest, res, next) => {
  const { companyId } = req.params;
  if (!uuidPattern.test(companyId)) {
    res.status(404).json({ error: "COMPANY_NOT_FOUND" });
    return;
  }
  try {
    const suspended = await prisma.$transaction(async (tx) => {
      const company = await tx.company.update({ where: { id: companyId }, data: { status: "SUSPENDED" } });
      await tx.user.updateMany({ where: { companyId, role: "COMPANY" }, data: { status: "SUSPENDED" } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "COMPANY_SUSPENDED", entityType: "Company", entityId: company.id } });
      return company;
    });
    res.json({ companyId: suspended.id, status: suspended.status });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/documents`, requireSession("UNIVERSITY"), uploadLimiter, upload.single("file"), async (req: SessionRequest, res, next) => {
  if (!req.file) {
    res.status(400).json({ error: "FILE_REQUIRED" });
    return;
  }
  const mediaType = detectMediaType(req.file.buffer);
  if (!mediaType) {
    res.status(415).json({ error: "UNSUPPORTED_OR_INVALID_FILE_SIGNATURE" });
    return;
  }
  const institutionId = req.session?.institutionId;
  if (!institutionId || !uuidPattern.test(institutionId)) {
    res.status(403).json({ error: "INSTITUTION_SCOPE_REQUIRED" });
    return;
  }
  const metadata = z.object({
    documentType: z.string().trim().min(2).max(100).optional(),
    holderReference: z.string().trim().min(1).max(160).optional(),
  }).safeParse(req.body);
  if (!metadata.success) {
    res.status(400).json({ error: "INVALID_DOCUMENT_METADATA", details: metadata.error.flatten() });
    return;
  }
  try {
    const documentId = crypto.randomUUID();
    const safeName = path.basename(req.file.originalname).replace(/[\r\n\0]/g, "_").slice(0, 180) || "document";
    const destination = path.join(storageRoot, institutionId, `${documentId}.bin`);
    await fs.mkdir(path.dirname(destination), { recursive: true, mode: 0o700 });
    await fs.writeFile(destination, req.file.buffer, { flag: "wx", mode: 0o600 });
    const activeTemplate = metadata.data.documentType ? await prisma.institutionTemplate.findFirst({
      where: { institutionId, documentType: metadata.data.documentType, active: true },
      orderBy: { version: "desc" },
    }) : null;
    let analysis: Record<string, unknown> = { status: "UNAVAILABLE", reason: "AI_SERVICE_NOT_CONFIGURED" };
    const aiUrl = process.env.AI_SERVICE_URL;
    const aiKey = process.env.AI_SERVICE_API_KEY;
    if (aiUrl && aiKey) {
      try {
        const form = new FormData();
        form.append("file", new Blob([req.file.buffer], { type: mediaType }), safeName);
        if (activeTemplate) form.append("template_json", JSON.stringify({
          id: activeTemplate.id,
          documentType: activeTemplate.documentType,
          templateName: activeTemplate.templateName,
          expectedFields: activeTemplate.expectedFields,
          expectedRegions: activeTemplate.expectedRegions,
        }));
        const response = await fetch(`${aiUrl.replace(/\/$/, "")}/api/v1/analyze-document`, {
          method: "POST", headers: { "x-api-key": aiKey }, body: form, signal: AbortSignal.timeout(60_000),
        });
        analysis = response.ok ? await response.json() as Record<string, unknown> : { status: "UNAVAILABLE", reason: `AI_SERVICE_HTTP_${response.status}` };
      } catch (error) {
        analysis = { status: "UNAVAILABLE", reason: error instanceof Error ? error.name : "AI_SERVICE_ERROR" };
      }
    }
    const digest = sha256(req.file.buffer);
    const classification = analysis.classification as Record<string, unknown> | undefined;
    const fingerprint = analysis.contentFingerprint as Record<string, unknown> | undefined;
    const record = await prisma.academicDocument.create({
      data: {
        id: documentId,
        institutionId,
        holderReference: metadata.data.holderReference,
        originalFileName: safeName,
        mediaType,
        sizeBytes: BigInt(req.file.size),
        storageReference: destination,
        documentSha256: digest,
        contentFingerprint: typeof fingerprint?.value === "string" && /^[0-9a-f]{64}$/i.test(fingerprint.value) ? fingerprint.value : undefined,
        documentType: metadata.data.documentType ?? (typeof classification?.documentType === "string" ? classification.documentType : undefined),
        status: "REVIEW_REQUIRED",
        ocrEvidence: (analysis.ocr as object | undefined) ?? undefined,
        extractedFields: (analysis.fieldExtraction as object | undefined) ?? undefined,
        analysisEvidence: analysis as object,
        uploadedById: req.session?.userId,
      },
    });
    const analysisStatus = typeof analysis.decision === "string" ? analysis.decision : typeof analysis.status === "string" ? analysis.status : "UNAVAILABLE";
    await prisma.auditLog.create({ data: { actorId: req.session!.userId, action: "DOCUMENT_UPLOADED", entityType: "AcademicDocument", entityId: record.id, details: { fileSha256: digest, byteLength: req.file.size, mediaType, analysisStatus } } });
    res.status(201).json({ documentId: record.id, status: record.status, documentType: record.documentType, holderReference: record.holderReference, template: activeTemplate ? { id: activeTemplate.id, name: activeTemplate.templateName, version: activeTemplate.version } : null, file: { name: safeName, mediaType, sizeBytes: req.file.size, documentSha256: digest, hashAlgorithm: "SHA-256" }, analysis });
  } catch (error) {
    next(error);
  }
});

const issueCredentialSchema = z.object({
  documentId: z.string().uuid(),
  credentialType: z.string().regex(/^[A-Za-z][A-Za-z0-9]{1,80}$/),
  subjectDid: z.string().startsWith("did:").max(255),
  credentialSubject: z.record(z.unknown()),
  expiresAt: z.string().datetime().optional(),
  supersedesId: z.string().uuid().optional(),
});

app.get(`${apiPrefix}/templates`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  try {
    const templates = await prisma.institutionTemplate.findMany({
      where: { institutionId: req.session!.institutionId },
      orderBy: [{ documentType: "asc" }, { version: "desc" }],
    });
    res.json({ templates });
  } catch (error) { next(error); }
});

app.post(`${apiPrefix}/templates`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const parsed = z.object({
    documentType: z.string().trim().min(2).max(100),
    templateName: z.string().trim().min(2).max(120),
    expectedFields: z.array(z.string().trim().min(1).max(80)).max(30).default([]),
    expectedRegions: z.object({ minPages: z.number().int().min(1).max(100).optional(), maxPages: z.number().int().min(1).max(100).optional() }).optional(),
    active: z.boolean().default(false),
  }).safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_TEMPLATE", details: parsed.error.flatten() });
    return;
  }
  try {
    const institutionId = req.session!.institutionId!;
    const template = await prisma.$transaction(async (tx) => {
      const latest = await tx.institutionTemplate.findFirst({ where: { institutionId, documentType: parsed.data.documentType }, orderBy: { version: "desc" }, select: { version: true } });
      if (parsed.data.active) await tx.institutionTemplate.updateMany({ where: { institutionId, documentType: parsed.data.documentType, active: true }, data: { active: false } });
      const created = await tx.institutionTemplate.create({ data: { institutionId, documentType: parsed.data.documentType, templateName: parsed.data.templateName, expectedFields: parsed.data.expectedFields, expectedRegions: parsed.data.expectedRegions, active: parsed.data.active, version: (latest?.version ?? 0) + 1 } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "INSTITUTION_TEMPLATE_CREATED", entityType: "InstitutionTemplate", entityId: created.id, details: { documentType: created.documentType, version: created.version, active: created.active } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json({ template });
  } catch (error) { next(error); }
});

app.post(`${apiPrefix}/templates/:templateId/activate`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const { templateId } = req.params;
  if (!uuidPattern.test(templateId)) { res.status(404).json({ error: "TEMPLATE_NOT_FOUND" }); return; }
  try {
    const institutionId = req.session!.institutionId!;
    const template = await prisma.$transaction(async (tx) => {
      const current = await tx.institutionTemplate.findFirst({ where: { id: templateId, institutionId } });
      if (!current) return null;
      await tx.institutionTemplate.updateMany({ where: { institutionId, documentType: current.documentType, active: true }, data: { active: false } });
      const activated = await tx.institutionTemplate.update({ where: { id: current.id }, data: { active: true } });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "INSTITUTION_TEMPLATE_ACTIVATED", entityType: "InstitutionTemplate", entityId: activated.id, details: { documentType: activated.documentType, version: activated.version } } });
      return activated;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!template) { res.status(404).json({ error: "TEMPLATE_NOT_FOUND" }); return; }
    res.json({ template });
  } catch (error) { next(error); }
});

app.get(`${apiPrefix}/documents`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  try {
    const documents = await prisma.academicDocument.findMany({
      where: { institutionId: req.session!.institutionId },
      select: { id: true, originalFileName: true, mediaType: true, sizeBytes: true, documentSha256: true, contentFingerprint: true, documentType: true, status: true, holderReference: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ documents: documents.map((item) => ({ ...item, sizeBytes: item.sizeBytes.toString() })) });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/documents/:documentId/cross-check`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const { documentId } = req.params;
  if (!uuidPattern.test(documentId)) { res.status(404).json({ error: "DOCUMENT_NOT_FOUND" }); return; }
  try {
    const institutionId = req.session!.institutionId!;
    const document = await prisma.academicDocument.findFirst({ where: { id: documentId, institutionId } });
    if (!document) { res.status(404).json({ error: "DOCUMENT_NOT_FOUND" }); return; }
    if (!document.holderReference) { res.status(409).json({ error: "HOLDER_REFERENCE_REQUIRED" }); return; }
    const records = await prisma.academicDocument.findMany({
      where: { institutionId, holderReference: document.holderReference },
      select: { id: true, documentType: true, extractedFields: true },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    const result = compareHolderDocuments(records);
    const previous = document.analysisEvidence && typeof document.analysisEvidence === "object" && !Array.isArray(document.analysisEvidence)
      ? document.analysisEvidence as Prisma.JsonObject : {};
    await prisma.$transaction([
      prisma.academicDocument.update({ where: { id: document.id }, data: { analysisEvidence: { ...previous, crossDocumentConsistency: result } as Prisma.InputJsonObject } }),
      prisma.auditLog.create({ data: { actorId: req.session!.userId, action: "DOCUMENT_CROSS_CHECKED", entityType: "AcademicDocument", entityId: document.id, details: { status: result.status, documentsCompared: records.length, mismatchFields: result.mismatches } } }),
    ]);
    res.json({ documentId, holderReference: document.holderReference, documentsCompared: records.length, ...result });
  } catch (error) { next(error); }
});

app.post(`${apiPrefix}/documents/:documentId/review`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const decision = z.object({ decision: z.enum(["APPROVE", "REJECT"]), reason: z.string().trim().min(5).max(500) }).safeParse(req.body);
  if (!uuidPattern.test(req.params.documentId) || !decision.success) {
    res.status(400).json({ error: "INVALID_DOCUMENT_REVIEW" });
    return;
  }
  try {
    const document = await prisma.academicDocument.findUnique({ where: { id: req.params.documentId } });
    if (!document || document.institutionId !== req.session?.institutionId) {
      res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      return;
    }
    if (document.status !== "REVIEW_REQUIRED" && document.status !== "UPLOADED") {
      res.status(409).json({ error: "DOCUMENT_ALREADY_REVIEWED", status: document.status });
      return;
    }
    const nextStatus = decision.data.decision === "APPROVE" ? "VERIFIED" : "FAILED";
    const updated = await prisma.academicDocument.update({ where: { id: document.id }, data: { status: nextStatus } });
    await prisma.auditLog.create({ data: { actorId: req.session!.userId, action: `DOCUMENT_${decision.data.decision}D`, entityType: "AcademicDocument", entityId: document.id, details: { reason: decision.data.reason, previousStatus: document.status, newStatus: updated.status, documentSha256: document.documentSha256 } } });
    res.json({ documentId: updated.id, status: updated.status, reviewDecision: decision.data.decision });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/credentials`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  try {
    const credentials = await prisma.credential.findMany({
      where: { institutionId: req.session!.institutionId },
      select: { id: true, credentialType: true, subjectReference: true, status: true, issuedAt: true, expiresAt: true, tokenId: true, transactionHash: true, supersedesId: true, document: { select: { id: true, originalFileName: true, documentSha256: true, documentType: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ credentials });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/credentials`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const parsed = issueCredentialSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "INVALID_CREDENTIAL_REQUEST", details: parsed.error.flatten() });
    return;
  }
  const issuerDid = process.env.VC_ISSUER_DID;
  const keyId = process.env.VC_ISSUER_KEY_ID;
  const privateKey = pemValue(process.env.VC_ISSUER_PRIVATE_KEY_PEM);
  const issuerScope = process.env.VC_ISSUER_INSTITUTION_ID;
  if (!issuerDid || !keyId || !privateKey || !issuerScope) {
    res.status(503).json({ error: "CREDENTIAL_ISSUER_NOT_CONFIGURED" });
    return;
  }
  if (!keyId.startsWith(`${issuerDid}#`) || req.session?.institutionId !== issuerScope) {
    res.status(403).json({ error: "ISSUER_KEY_NOT_AUTHORIZED_FOR_INSTITUTION" });
    return;
  }
  try {
    const institution = await prisma.institution.findUnique({ where: { id: issuerScope } });
    const document = await prisma.academicDocument.findUnique({ where: { id: parsed.data.documentId } });
    if (!institution || institution.status !== "ACTIVE" || !document || document.institutionId !== issuerScope) {
      res.status(404).json({ error: "AUTHORIZED_SOURCE_DOCUMENT_NOT_FOUND" });
      return;
    }
    if (document.status !== "VERIFIED") {
      res.status(409).json({ error: "DOCUMENT_REVIEW_REQUIRED", documentStatus: document.status });
      return;
    }
    const id = crypto.randomUUID();
    const issuedAt = new Date();
    if (Object.prototype.hasOwnProperty.call(parsed.data.credentialSubject, "id")) {
      res.status(400).json({ error: "SUBJECT_ID_MUST_USE_SUBJECT_DID_FIELD" });
      return;
    }
    if (Buffer.byteLength(JSON.stringify(parsed.data.credentialSubject), "utf8") > 48_000) {
      res.status(413).json({ error: "CREDENTIAL_SUBJECT_TOO_LARGE" });
      return;
    }
    const vc = {
      "@context": ["https://www.w3.org/ns/credentials/v2"],
      id: `urn:uuid:${id}`,
      type: ["VerifiableCredential", parsed.data.credentialType],
      issuer: issuerDid,
      validFrom: issuedAt.toISOString(),
      ...(parsed.data.expiresAt ? { validUntil: parsed.data.expiresAt } : {}),
      credentialSubject: { id: parsed.data.subjectDid, ...parsed.data.credentialSubject },
    };
    const token = jwt.sign(
      { iss: issuerDid, sub: parsed.data.subjectDid, jti: id, nbf: Math.floor(issuedAt.getTime() / 1000), vc },
      privateKey,
      { algorithm: "ES256", keyid: keyId },
    );
    const row = await prisma.$transaction(async (tx) => {
      if (parsed.data.supersedesId) {
        const previous = await tx.credential.findFirst({ where: { id: parsed.data.supersedesId, institutionId: issuerScope }, include: { versions: { select: { id: true } } } });
        if (!previous || previous.credentialType !== parsed.data.credentialType || previous.subjectReference !== parsed.data.subjectDid) throw new Error("CREDENTIAL_VERSION_PARENT_MISMATCH");
        if (previous.versions.length) throw new Error("CREDENTIAL_VERSION_BRANCH_NOT_ALLOWED");
        if (previous.transactionHash && previous.status !== "REVOKED") throw new Error("CREDENTIAL_VERSION_REQUIRES_ONCHAIN_REVOCATION");
        if (!["ACTIVE", "REVOKED", "EXPIRED"].includes(previous.status)) throw new Error("CREDENTIAL_VERSION_PARENT_NOT_REPLACEABLE");
        const changed = await tx.credential.updateMany({ where: { id: previous.id, status: previous.status }, data: { status: "SUPERSEDED" } });
        if (changed.count !== 1) throw new Error("CREDENTIAL_VERSION_CONCURRENT_UPDATE");
        await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "CREDENTIAL_SUPERSEDED", entityType: "Credential", entityId: previous.id, details: { replacementCredentialId: id, previousTransactionHash: previous.transactionHash } } });
      }
      const created = await tx.credential.create({
        data: {
          id,
          institutionId: issuerScope,
          documentId: document.id,
          credentialType: parsed.data.credentialType,
          subjectReference: parsed.data.subjectDid,
          issuerDid,
          credentialJson: vc as Prisma.InputJsonValue,
          credentialJws: token,
          credentialSha256: sha256(token),
          status: "ACTIVE",
          issuedAt,
          expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
          supersedesId: parsed.data.supersedesId,
        },
      });
      await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "CREDENTIAL_ISSUED", entityType: "Credential", entityId: created.id, details: { credentialSha256: created.credentialSha256, documentSha256: document.documentSha256, signingAlgorithm: "ES256", supersedesId: parsed.data.supersedesId ?? null } } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    res.status(201).json({ credentialId: row.id, status: row.status, issuerDid, subjectDid: row.subjectReference, credentialSha256: row.credentialSha256, supersedesCredentialId: row.supersedesId, proof: { format: "VC-JWT", algorithm: "ES256", verificationStatus: "SIGNED" }, blockchain: { status: "NOT_RECORDED" } });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("CREDENTIAL_VERSION_")) {
      res.status(409).json({ error: error.message });
      return;
    }
    next(error);
  }
});

app.post(`${apiPrefix}/credentials/:credentialId/mint`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const { credentialId } = req.params;
  if (!uuidPattern.test(credentialId)) {
    res.status(400).json({ error: "INVALID_CREDENTIAL_ID" });
    return;
  }
  const config = blockchainConfig();
  const verifyBaseUrl = process.env.VERIFY_BASE_URL;
  if (!config) {
    res.status(503).json({ error: "BLOCKCHAIN_ISSUER_NOT_CONFIGURED" });
    return;
  }
  if (!verifyBaseUrl || !/^https?:\/\//i.test(verifyBaseUrl)) {
    res.status(503).json({ error: "PUBLIC_RESOLVER_URL_NOT_CONFIGURED" });
    return;
  }
  try {
    const row = await prisma.credential.findUnique({ where: { id: credentialId }, include: { document: true } });
    if (!row || row.institutionId !== req.session?.institutionId) {
      res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
      return;
    }
    if (row.status !== "ACTIVE" || !row.document || !row.credentialJws || verifyCredentialJws(row.credentialJws, row.issuerDid) !== "VERIFIED") {
      res.status(409).json({ error: "CREDENTIAL_NOT_READY_FOR_MINTING" });
      return;
    }
    if (row.transactionHash) {
      res.status(409).json({ error: "CREDENTIAL_ALREADY_MINTED", tokenId: row.tokenId, transactionHash: row.transactionHash });
      return;
    }

    const provider = await blockchainProvider(config);
    const signer = new Wallet(config.privateKey, provider);
    const contract = new Contract(config.contractAddress, blockchainAbi, signer);
    const issuerRole = await contract.ISSUER_ROLE();
    if (!(await contract.hasRole(issuerRole, signer.address))) {
      res.status(403).json({ error: "BLOCKCHAIN_SIGNER_NOT_AUTHORIZED" });
      return;
    }
    const reference = credentialReference(row.id);
    if (BigInt(await contract.tokenForCredential(reference)) !== 0n) {
      res.status(409).json({ error: "ONCHAIN_CREDENTIAL_EXISTS_RECONCILIATION_REQUIRED" });
      return;
    }
    const digest = `0x${row.document.documentSha256}`;
    let ipfsMetadata: { cid: string; uri: string } | null;
    try {
      ipfsMetadata = await uploadPublicCredentialMetadata(row.id, {
        type: "AcadShieldCredentialMetadata",
        credentialId: row.id,
        credentialType: row.credentialType,
        issuer: row.issuerDid,
        documentSha256: row.document.documentSha256,
        verificationUrl: `${verifyBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(row.id)}`,
        personalDataIncluded: false,
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : "IPFS_ERROR";
      res.status(503).json({ error: reason.startsWith("IPFS_PINATA_") ? reason : "IPFS_METADATA_UPLOAD_FAILED" });
      return;
    }
    const metadataURI = ipfsMetadata?.uri ?? `${verifyBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(row.id)}`;
    const transaction = await contract.mintCredential(config.recipientAddress, reference, digest, metadataURI);
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1) {
      res.status(502).json({ error: "BLOCKCHAIN_TRANSACTION_NOT_CONFIRMED", transactionHash: transaction.hash });
      return;
    }
    const minted = receipt.logs.map((log: { topics: readonly string[]; data: string }) => {
      try { return contract.interface.parseLog(log); } catch { return null; }
    }).find((event: { name?: string } | null) => event?.name === "CredentialMinted");
    if (!minted || String(minted.args.credentialRef).toLowerCase() !== reference.toLowerCase() || String(minted.args.documentSha256).toLowerCase() !== digest.toLowerCase() || String(minted.args.metadataURI) !== metadataURI) {
      res.status(502).json({ error: "MINT_EVENT_NOT_FOUND", transactionHash: transaction.hash });
      return;
    }
    const tokenId = BigInt(minted.args.tokenId);
    const blockNumber = BigInt(receipt.blockNumber);
    const updated = await prisma.credential.update({
      where: { id: row.id },
      data: { chainId: Number(config.chainId), contractAddress: config.contractAddress, tokenId: tokenId.toString(), transactionHash: transaction.hash, metadataCid: ipfsMetadata?.cid ?? null, metadataUri: metadataURI, blockNumber, mintedAt: new Date() },
    });
    await prisma.auditLog.create({ data: { actorId: req.session!.userId, action: "CREDENTIAL_MINTED", entityType: "Credential", entityId: row.id, details: { tokenId: tokenId.toString(), transactionHash: transaction.hash, blockNumber: blockNumber.toString(), chainId: Number(config.chainId), contractAddress: config.contractAddress, documentSha256: row.document.documentSha256, metadataCid: ipfsMetadata?.cid ?? null } } });
    res.status(201).json({ credentialId: updated.id, tokenId: updated.tokenId, transactionHash: updated.transactionHash, blockNumber: updated.blockNumber?.toString(), chainId: updated.chainId, contractAddress: updated.contractAddress, metadataCid: updated.metadataCid, metadataUri: updated.metadataUri, status: "CONFIRMED" });
  } catch (error) {
    if (error instanceof Error && error.message === "BLOCKCHAIN_NETWORK_MISMATCH") {
      res.status(503).json({ error: "BLOCKCHAIN_NETWORK_MISMATCH" });
      return;
    }
    next(error);
  }
});

app.post(`${apiPrefix}/credentials/:credentialId/revoke`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const { credentialId } = req.params;
  const parsed = z.object({ reason: z.string().trim().min(5).max(500) }).safeParse(req.body);
  if (!uuidPattern.test(credentialId) || !parsed.success) {
    res.status(400).json({ error: "INVALID_REVOCATION_REQUEST" });
    return;
  }
  try {
    const row = await prisma.credential.findUnique({ where: { id: credentialId } });
    if (!row || row.institutionId !== req.session?.institutionId) {
      res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
      return;
    }
    if (row.status !== "ACTIVE") {
      res.status(409).json({ error: "CREDENTIAL_NOT_ACTIVE", status: row.status });
      return;
    }
    let revocationTransaction: string | null = null;
    if (row.transactionHash) {
      const config = blockchainConfig();
      if (!config) {
        res.status(503).json({ error: "BLOCKCHAIN_ISSUER_NOT_CONFIGURED", status: "UNCHANGED" });
        return;
      }
      if (row.chainId !== Number(config.chainId) || row.contractAddress?.toLowerCase() !== config.contractAddress.toLowerCase() || !row.tokenId) {
        res.status(409).json({ error: "ONCHAIN_CREDENTIAL_REFERENCE_MISMATCH", status: "UNCHANGED" });
        return;
      }
      const provider = await blockchainProvider(config);
      const signer = new Wallet(config.privateKey, provider);
      const contract = new Contract(config.contractAddress, blockchainAbi, signer);
      const issuerRole = await contract.ISSUER_ROLE();
      if (!(await contract.hasRole(issuerRole, signer.address))) {
        res.status(403).json({ error: "BLOCKCHAIN_SIGNER_NOT_AUTHORIZED", status: "UNCHANGED" });
        return;
      }
      const reference = credentialReference(row.id);
      const record = await contract.records(BigInt(row.tokenId));
      if (String(record.credentialRef).toLowerCase() !== reference.toLowerCase()) {
        res.status(409).json({ error: "ONCHAIN_CREDENTIAL_REFERENCE_MISMATCH", status: "UNCHANGED" });
        return;
      }
      if (!record.revoked) {
        const tx = await contract.revokeCredential(reference);
        const receipt = await tx.wait();
        if (!receipt || receipt.status !== 1) {
          res.status(502).json({ error: "BLOCKCHAIN_REVOCATION_NOT_CONFIRMED", transactionHash: tx.hash, status: "UNCHANGED" });
          return;
        }
        revocationTransaction = tx.hash;
      }
    }
    const revokedAt = new Date();
    const updated = await prisma.credential.update({ where: { id: row.id }, data: { status: "REVOKED", revokedAt, revocationReason: parsed.data.reason } });
    await prisma.auditLog.create({ data: { actorId: req.session!.userId, action: "CREDENTIAL_REVOKED", entityType: "Credential", entityId: row.id, details: { reason: parsed.data.reason, revokedAt: revokedAt.toISOString(), onChainStatus: row.transactionHash ? "REVOKED" : "NOT_RECORDED", revocationTransaction } } });
    res.json({ credentialId: updated.id, status: updated.status, revokedAt, blockchain: row.transactionHash ? { status: "REVOKED", transactionHash: revocationTransaction } : { status: "NOT_RECORDED" } });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/documents/:documentId`, requireSession("UNIVERSITY", "ADMIN"), async (req: SessionRequest, res, next) => {
  if (!uuidPattern.test(req.params.documentId)) {
    res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
    return;
  }
  try {
    const document = await prisma.academicDocument.findUnique({ where: { id: req.params.documentId } });
    if (!document || (req.session?.role !== "ADMIN" && document.institutionId !== req.session?.institutionId)) {
      res.status(404).json({ error: "DOCUMENT_NOT_FOUND" });
      return;
    }
    res.json({ id: document.id, fileName: document.originalFileName, mediaType: document.mediaType, sizeBytes: document.sizeBytes.toString(), documentSha256: document.documentSha256, contentFingerprint: document.contentFingerprint, documentType: document.documentType, status: document.status, ocrEvidence: document.ocrEvidence, extractedFields: document.extractedFields, analysisEvidence: document.analysisEvidence, createdAt: document.createdAt });
  } catch (error) {
    next(error);
  }
});

function constantTimeSecretMatch(received: string | undefined, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  const receivedHash = crypto.createHash("sha256").update(received).digest();
  const expectedHash = crypto.createHash("sha256").update(expected).digest();
  return crypto.timingSafeEqual(receivedHash, expectedHash);
}

function requireInternalService(req: Request, res: Response, next: NextFunction): void {
  if (!process.env.INTERNAL_SERVICE_API_KEY) {
    res.status(503).json({ error: "INTERNAL_SERVICE_NOT_CONFIGURED" });
    return;
  }
  if (!constantTimeSecretMatch(req.header("x-api-key"), process.env.INTERNAL_SERVICE_API_KEY)) {
    res.status(401).json({ error: "UNAUTHORIZED" });
    return;
  }
  next();
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

app.get(`${apiPrefix}/verify/:credentialId`, async (req, res, next) => {
  const { credentialId } = req.params;
  if (!uuidPattern.test(credentialId)) {
    res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
    return;
  }
  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: { institution: true, document: true },
    });
    if (!credential) {
      res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
      return;
    }
    const proofStatus = verifyCredentialJws(credential.credentialJws, credential.issuerDid);
    const blockchainStatus = await verifyOnChain(credential);
    const sourceProviderStatus = await configuredSourceProvider().getStatus(credential.id);
    const expired = credential.expiresAt !== null && credential.expiresAt.getTime() <= Date.now();
    const decision = decideVerification({
      lifecycle: credential.status,
      expired,
      issuerActive: credential.institution.status === "ACTIVE",
      documentRegistered: Boolean(credential.document),
      hashCompared: false,
      hashMatches: null,
      signature: proofStatus,
      blockchain: blockchainStatus,
    });
    res.json({
      credentialId: credential.id,
      credentialType: credential.credentialType,
      issuer: { name: credential.institution.name, status: credential.institution.status },
      status: credential.status,
      issuedAt: credential.issuedAt,
      expiresAt: credential.expiresAt,
      documentSha256: credential.document?.documentSha256 ?? null,
      sourceProvider: sourceProviderStatus,
      decision,
      checks: {
        issuer: credential.institution.status === "ACTIVE" ? "REGISTERED" : "NOT_AUTHORIZED",
        credentialProof: proofStatus,
        sourceRecord: credential.document ? "REGISTERED" : "MISSING",
        blockchain: blockchainStatus,
      },
      chainProof: credential.transactionHash ? {
        chainId: credential.chainId,
        contractAddress: credential.contractAddress,
        tokenId: credential.tokenId,
        transactionHash: credential.transactionHash,
        blockNumber: credential.blockNumber?.toString() ?? null,
        mintedAt: credential.mintedAt,
        metadataCid: credential.metadataCid,
        metadataUri: credential.metadataUri,
      } : null,
    });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/credentials/:credentialId/qr`, requireSession("UNIVERSITY"), async (req: SessionRequest, res, next) => {
  const { credentialId } = req.params;
  const verifyBaseUrl = process.env.VERIFY_BASE_URL;
  if (!uuidPattern.test(credentialId)) {
    res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
    return;
  }
  if (!verifyBaseUrl || !/^https?:\/\//i.test(verifyBaseUrl)) {
    res.status(503).json({ error: "PUBLIC_RESOLVER_URL_NOT_CONFIGURED" });
    return;
  }
  try {
    const credential = await prisma.credential.findUnique({ where: { id: credentialId } });
    if (!credential || credential.institutionId !== req.session?.institutionId) {
      res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
      return;
    }
    const verificationUrl = `${verifyBaseUrl.replace(/\/$/, "")}/${encodeURIComponent(credential.id)}`;
    const qrDataUrl = await QRCode.toDataURL(verificationUrl, { errorCorrectionLevel: "M", margin: 2, width: 512 });
    await prisma.auditLog.create({ data: { actorId: req.session!.userId, action: "CREDENTIAL_QR_GENERATED", entityType: "Credential", entityId: credential.id, details: { verificationUrl } } });
    res.json({ credentialId: credential.id, verificationUrl, qrDataUrl, decisionEndpoint: `${apiPrefix}/verify/${encodeURIComponent(credential.id)}` });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/internal/verify-credential`, requireInternalService, async (req, res, next) => {
  const credentialId = req.body?.credentialId;
  if (typeof credentialId !== "string" || !uuidPattern.test(credentialId)) {
    res.status(400).json({ error: "INVALID_CREDENTIAL_ID" });
    return;
  }
  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      include: { institution: true, document: true },
    });
    if (!credential) {
      res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" });
      return;
    }
    const requestedHash = req.body?.documentSha256;
    if (typeof requestedHash !== "string" || !/^[0-9a-f]{64}$/i.test(requestedHash)) {
      res.status(400).json({ error: "DOCUMENT_SHA256_REQUIRED" });
      return;
    }
    const hashMatches = credential.document?.documentSha256 === requestedHash.toLowerCase();
    const issuerActive = credential.institution.status === "ACTIVE";
    const expired = credential.expiresAt !== null && credential.expiresAt.getTime() <= Date.now();
    const proofStatus = verifyCredentialJws(credential.credentialJws, credential.issuerDid);
    const blockchainStatus = await verifyOnChain(credential);
    const sourceProviderStatus = await configuredSourceProvider().verifyCredential(credential.id, requestedHash.toLowerCase());
    const decision = decideVerification({
      lifecycle: credential.status,
      expired,
      issuerActive,
      documentRegistered: Boolean(credential.document),
      hashCompared: true,
      hashMatches,
      signature: proofStatus,
      blockchain: blockchainStatus,
    });

    const verification = await prisma.verification.create({
      data: {
        credentialId: credential.id,
        documentId: credential.documentId,
        decision,
        deterministicEvidence: {
          issuerStatus: credential.institution.status,
          lifecycleStatus: credential.status,
          expirationChecked: true,
          documentHashCompared: true,
          documentHashMatch: hashMatches,
          signatureStatus: proofStatus,
          sourceStatus: "REGISTERED",
          sourceProviderStatus: { status: sourceProviderStatus.status, provider: sourceProviderStatus.provider, evidence: sourceProviderStatus.evidence, checkedAt: sourceProviderStatus.checkedAt },
          blockchainStatus,
        },
        sourceStatus: "REGISTERED",
      },
    });
    res.json({ verificationId: verification.id, credentialId, decision, hashMatches, sourceStatus: "REGISTERED", sourceProvider: sourceProviderStatus, signatureStatus: proofStatus, blockchainStatus });
  } catch (error) {
    next(error);
  }
});

app.post(`${apiPrefix}/company/verifications`, requireSession("COMPANY"), uploadLimiter, upload.single("file"), async (req: SessionRequest, res, next) => {
  const credentialId = req.body?.credentialId;
  if (typeof credentialId !== "string" || !uuidPattern.test(credentialId) || !req.file) {
    res.status(400).json({ error: "CREDENTIAL_ID_AND_FILE_REQUIRED" });
    return;
  }
  const mediaType = detectMediaType(req.file.buffer);
  if (!mediaType) {
    res.status(415).json({ error: "UNSUPPORTED_OR_INVALID_FILE_SIGNATURE" });
    return;
  }
  const companyId = req.session?.companyId;
  if (!companyId) {
    res.status(403).json({ error: "COMPANY_SCOPE_REQUIRED" });
    return;
  }
  try {
    const [company, credential] = await Promise.all([
      prisma.company.findUnique({ where: { id: companyId } }),
      prisma.credential.findUnique({ where: { id: credentialId }, include: { institution: true, document: true } }),
    ]);
    if (!company || company.status !== "ACTIVE") {
      res.status(403).json({ error: "COMPANY_NOT_ACTIVE" });
      return;
    }
    const fileSha256 = sha256(req.file.buffer);
    const proofStatus = credential ? verifyCredentialJws(credential.credentialJws, credential.issuerDid) : "MISSING";
    const hashMatches = Boolean(credential?.document && credential.document.documentSha256 === fileSha256);
    const blockchainStatus = credential ? await verifyOnChain(credential) : "NOT_RECORDED";
    const sourceProviderStatus = credential ? await configuredSourceProvider().verifyCredential(credential.id, fileSha256) : { status: "NOT_FOUND", provider: "SOURCE_PROVIDER", evidence: ["Credential does not exist in Core"], checkedAt: new Date().toISOString() };
    const expired = credential?.expiresAt !== null && credential?.expiresAt !== undefined && credential.expiresAt.getTime() <= Date.now();
    const decision = credential ? decideVerification({
      lifecycle: credential.status,
      expired,
      issuerActive: credential.institution.status === "ACTIVE",
      documentRegistered: Boolean(credential.document),
      hashCompared: true,
      hashMatches,
      signature: proofStatus,
      blockchain: blockchainStatus,
    }) : "INVALID";
    const verification = await prisma.verification.create({
      data: {
        credentialId: credential?.id,
        companyId,
        decision,
        deterministicEvidence: {
          submittedFileSha256: fileSha256,
          hashAlgorithm: "SHA-256",
          registeredDocumentSha256: credential?.document?.documentSha256 ?? null,
          exactHashMatch: credential?.document ? hashMatches : false,
          issuerActive: credential?.institution.status === "ACTIVE",
          lifecycleStatus: credential?.status ?? "NOT_FOUND",
          credentialProofStatus: proofStatus,
          sourceStatus: credential ? "REGISTERED" : "NOT_FOUND",
          sourceProviderStatus: { status: sourceProviderStatus.status, provider: sourceProviderStatus.provider, evidence: sourceProviderStatus.evidence, checkedAt: sourceProviderStatus.checkedAt },
          blockchainStatus,
        },
        aiEvidence: { status: "NOT_RUN", reason: "Company document AI comparison is not connected" },
        sourceStatus: credential ? "REGISTERED" : "NOT_FOUND",
      },
    });
    await prisma.auditLog.create({ data: { action: "COMPANY_CREDENTIAL_VERIFIED", entityType: "Verification", entityId: verification.id, details: { companyId, credentialId, fileSha256, decision } } });
    res.status(201).json({ verificationId: verification.id, credentialId, decision, submittedFile: { mediaType, sizeBytes: req.file.size, sha256: fileSha256, hashAlgorithm: "SHA-256" }, exactHashMatch: credential?.document ? hashMatches : false, credentialProofStatus: proofStatus, sourceStatus: credential ? "REGISTERED" : "NOT_FOUND", sourceProvider: sourceProviderStatus, blockchainStatus, aiAnalysis: "NOT_RUN" });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/company/verifications`, requireSession("COMPANY"), async (req: SessionRequest, res, next) => {
  const companyId = req.session?.companyId;
  if (!companyId) {
    res.status(403).json({ error: "COMPANY_SCOPE_REQUIRED" });
    return;
  }
  try {
    const rows = await prisma.verification.findMany({
      where: { companyId },
      include: { credential: { select: { id: true, credentialType: true, document: { select: { documentType: true, originalFileName: true, documentSha256: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    res.json({ verifications: rows });
  } catch (error) {
    next(error);
  }
});

app.get(`${apiPrefix}/company/verifications/:verificationId`, requireSession("COMPANY"), async (req: SessionRequest, res, next) => {
  const companyId = req.session?.companyId;
  const { verificationId } = req.params;
  if (!companyId) {
    res.status(403).json({ error: "COMPANY_SCOPE_REQUIRED" });
    return;
  }
  if (!uuidPattern.test(verificationId)) {
    res.status(404).json({ error: "VERIFICATION_NOT_FOUND" });
    return;
  }
  try {
    const verification = await prisma.verification.findFirst({ where: { id: verificationId, companyId }, include: { credential: { select: { id: true, credentialType: true, issuerDid: true, credentialSha256: true, document: { select: { documentType: true, originalFileName: true, documentSha256: true } } } } } });
    if (!verification) {
      res.status(404).json({ error: "VERIFICATION_NOT_FOUND" });
      return;
    }
    res.json({ verification });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Do not leak SQL, credential, or file details through public API responses.
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    res.status(413).json({ error: "DOCUMENT_TOO_LARGE", maxBytes: maxDocumentBytes });
    return;
  }
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    res.status(409).json({ error: "RECORD_ALREADY_EXISTS" });
    return;
  }
  console.error("API request failed", error instanceof Error ? error.name : "unknown error");
  res.status(500).json({ error: "INTERNAL_SERVER_ERROR" });
});

export { app };

if (require.main === module) {
  const server = app.listen(port, () => console.log(`AcadShield API listening on ${port}`));
  async function shutdown(): Promise<void> {
    server.close();
    await prisma.$disconnect();
  }

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}
