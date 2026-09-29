import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { Express, Request, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import rateLimit from "express-rate-limit";
import { z } from "zod";

type SessionRequest = Request & { session?: { userId: string; institutionId?: string } };
const digest = (value: string) => crypto.createHash("sha256").update(value).digest("hex");
const credentialSelect = { id: true, credentialType: true, status: true, issuerDid: true, issuedAt: true, expiresAt: true } as const;
const shareSelect = { id: true, purpose: true, credentialIds: true, expiresAt: true, revokedAt: true, createdAt: true } as const;

export function registerSharingRoutes(app: Express, prisma: PrismaClient, student: RequestHandler, university: RequestHandler) {
  app.get("/api/v1/student/profile", student, async (req: SessionRequest, res, next) => {
    try {
      const owner = await prisma.user.findUnique({ where: { id: req.session!.userId }, select: { id: true, email: true, institutionId: true, subjectReference: true, status: true } });
      res.json({ records: owner ? [owner] : [] });
    } catch (error) { next(error); }
  });
  app.get("/api/v1/student/credentials/:id", student, async (req: SessionRequest, res, next) => {
    if (!z.string().uuid().safeParse(req.params.id).success) { res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" }); return; }
    try {
      const owner = await prisma.user.findUnique({ where: { id: req.session!.userId } });
      if (!owner?.institutionId || !owner.subjectReference) { res.status(403).json({ error: "STUDENT_NOT_ENROLLED" }); return; }
      const row = await prisma.credential.findFirst({ where: { id: req.params.id, institutionId: owner.institutionId, subjectReference: owner.subjectReference }, select: credentialSelect });
      if (!row) { res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" }); return; }
      res.json({ records: [row] });
    } catch (error) { next(error); }
  });
  app.get("/api/v1/student/documents", student, async (req: SessionRequest, res, next) => {
    const parsed = z.object({ cursor: z.string().uuid().optional() }).safeParse(req.query);
    if (!parsed.success) { res.status(400).json({ error: "INVALID_PAGINATION" }); return; }
    try {
      const owner = await prisma.user.findUnique({ where: { id: req.session!.userId } });
      if (!owner?.institutionId || !owner.subjectReference) { res.status(403).json({ error: "STUDENT_NOT_ENROLLED" }); return; }
      const rows = await prisma.academicDocument.findMany({ where: { institutionId: owner.institutionId, credentials: { some: { institutionId: owner.institutionId, subjectReference: owner.subjectReference } } }, select: { id: true, originalFileName: true, documentType: true, status: true, createdAt: true }, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51, ...(parsed.data.cursor ? { cursor: { id: parsed.data.cursor }, skip: 1 } : {}) });
      res.json({ records: rows.slice(0, 50), limit: 50, nextCursor: rows.length > 50 ? rows[49].id : null });
    } catch (error) { next(error); }
  });
  app.post("/api/v1/students", university, async (req: SessionRequest, res, next) => {
    const parsed = z.object({ email: z.string().email().max(254), password: z.string().min(12).max(72), subjectReference: z.string().startsWith("did:").max(160) }).strict().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "INVALID_STUDENT" }); return; }
    if (!req.session?.institutionId) { res.status(403).json({ error: "INSTITUTION_SCOPE_REQUIRED" }); return; }
    try {
      const passwordHash = await bcrypt.hash(parsed.data.password, 12);
      const user = await prisma.$transaction(async tx => {
        const created = await tx.user.create({ data: { email: parsed.data.email.toLowerCase(), passwordHash, role: "STUDENT", status: "ACTIVE", institutionId: req.session!.institutionId, subjectReference: parsed.data.subjectReference }, select: { id: true, email: true, subjectReference: true } });
        await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "STUDENT_ENROLLED", entityType: "User", entityId: created.id } });
        return created;
      });
      res.status(201).json(user);
    } catch (error) {
      if ((error as { code?: string }).code === "P2002") { res.status(409).json({ error: "STUDENT_ALREADY_ENROLLED" }); return; }
      next(error);
    }
  });
  app.get("/api/v1/student/credentials", student, async (req: SessionRequest, res, next) => {
    try {
      const owner = await prisma.user.findUnique({ where: { id: req.session!.userId } });
      if (!owner?.institutionId || !owner.subjectReference) { res.status(403).json({ error: "STUDENT_NOT_ENROLLED" }); return; }
      const parsed = z.object({ cursor: z.string().uuid().optional() }).safeParse(req.query);
      if (!parsed.success) { res.status(400).json({ error: "INVALID_PAGINATION" }); return; }
      const rows = await prisma.credential.findMany({ where: { institutionId: owner.institutionId, subjectReference: owner.subjectReference }, select: credentialSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51, ...(parsed.data.cursor ? { cursor: { id: parsed.data.cursor }, skip: 1 } : {}) });
      res.json({ records: rows.slice(0, 50), nextCursor: rows.length > 50 ? rows[49].id : null, limit: 50 });
    } catch (error) { next(error); }
  });
  app.get("/api/v1/student/shares", student, async (req: SessionRequest, res, next) => {
    try {
      const parsed = z.object({ cursor: z.string().uuid().optional() }).safeParse(req.query);
      if (!parsed.success) { res.status(400).json({ error: "INVALID_PAGINATION" }); return; }
      const rows = await prisma.shareGrant.findMany({ where: { ownerId: req.session!.userId }, select: shareSelect, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 51, ...(parsed.data.cursor ? { cursor: { id: parsed.data.cursor }, skip: 1 } : {}) });
      res.json({ records: rows.slice(0, 50), nextCursor: rows.length > 50 ? rows[49].id : null, limit: 50 });
    } catch (error) { next(error); }
  });
  app.post("/api/v1/student/shares", student, async (req: SessionRequest, res, next) => {
    const parsed = z.object({ credentialIds: z.array(z.string().uuid()).min(1).max(20), purpose: z.string().trim().min(5).max(200), expiresAt: z.string().datetime(), consent: z.literal(true) }).strict().safeParse(req.body);
    if (!parsed.success || new Set(parsed.data?.credentialIds).size !== parsed.data?.credentialIds.length) { res.status(400).json({ error: "INVALID_SHARE_REQUEST" }); return; }
    const expiresAt = new Date(parsed.data.expiresAt);
    if (expiresAt.getTime() <= Date.now() || expiresAt.getTime() > Date.now() + 30 * 86400000) { res.status(400).json({ error: "SHARE_EXPIRY_MUST_BE_WITHIN_30_DAYS" }); return; }
    try {
      const token = crypto.randomBytes(32).toString("base64url");
      const grant = await prisma.$transaction(async tx => {
        const owner = await tx.user.findUnique({ where: { id: req.session!.userId } });
        if (!owner?.institutionId || !owner.subjectReference || owner.status !== "ACTIVE") throw new Error("SHARE_NOT_AUTHORIZED");
        const rows = await tx.credential.findMany({ where: { id: { in: parsed.data.credentialIds }, institutionId: owner.institutionId, subjectReference: owner.subjectReference, status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, select: { id: true } });
        if (rows.length !== parsed.data.credentialIds.length) throw new Error("SHARE_NOT_AUTHORIZED");
        const created = await tx.shareGrant.create({ data: { ownerId: owner.id, credentialIds: parsed.data.credentialIds, purpose: parsed.data.purpose, expiresAt, tokenHash: digest(token) }, select: shareSelect });
        await tx.auditLog.create({ data: { actorId: owner.id, action: "SHARE_CONSENT_GRANTED", entityType: "ShareGrant", entityId: created.id, details: { credentialIds: parsed.data.credentialIds, purpose: parsed.data.purpose, expiresAt: expiresAt.toISOString(), disclosure: "CREDENTIAL_STATUS_SUMMARY" } } });
        return created;
      });
      res.status(201).json({ ...grant, token, disclosure: "Credential ID, type, issuer, lifecycle status and dates only. Anyone with the link can view until expiry or revocation. Not proof of authenticity." });
    } catch (error) {
      if (error instanceof Error && error.message === "SHARE_NOT_AUTHORIZED") { res.status(403).json({ error: error.message }); return; }
      next(error);
    }
  });
  app.post("/api/v1/student/shares/:id/revoke", student, async (req: SessionRequest, res, next) => {
    if (!z.string().uuid().safeParse(req.params.id).success) { res.status(400).json({ error: "INVALID_SHARE_ID" }); return; }
    try {
      const count = await prisma.$transaction(async tx => {
        const changed = await tx.shareGrant.updateMany({ where: { id: req.params.id, ownerId: req.session!.userId, revokedAt: null }, data: { revokedAt: new Date() } });
        if (changed.count) await tx.auditLog.create({ data: { actorId: req.session!.userId, action: "SHARE_REVOKED", entityType: "ShareGrant", entityId: req.params.id } });
        return changed.count;
      });
      res.status(count ? 200 : 404).json(count ? { status: "REVOKED" } : { error: "SHARE_NOT_FOUND" });
    } catch (error) { next(error); }
  });
  const limiter = rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false });
  app.post("/api/v1/shares/resolve", limiter, async (req, res, next) => {
    res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" });
    const parsed = z.object({ token: z.string().regex(/^[A-Za-z0-9_-]{43}$/) }).strict().safeParse(req.body);
    if (!parsed.success) { res.status(400).json({ error: "INVALID_SHARE_TOKEN" }); return; }
    try {
      const grant = await prisma.shareGrant.findUnique({ where: { tokenHash: digest(parsed.data.token) }, include: { owner: { include: { institution: true } } } });
      if (!grant || grant.revokedAt || grant.expiresAt <= new Date() || grant.owner.status !== "ACTIVE" || grant.owner.institution?.status !== "ACTIVE" || !grant.owner.subjectReference) {
        res.status(404).json({ error: "SHARE_UNAVAILABLE" }); return;
      }
      const records = await prisma.credential.findMany({ where: { id: { in: grant.credentialIds }, institutionId: grant.owner.institutionId!, subjectReference: grant.owner.subjectReference }, select: credentialSelect });
      await prisma.auditLog.create({ data: { action: "SHARE_VIEWED", entityType: "ShareGrant", entityId: grant.id, details: { disclosedCount: records.length } } });
      res.json({ purpose: grant.purpose, expiresAt: grant.expiresAt, records: records.map(row => ({ ...row, status: row.status === "ACTIVE" && row.expiresAt && row.expiresAt <= new Date() ? "EXPIRED" : row.status })), note: "Issuer registry summary, not a cryptographic verification report. No document or personal subject fields are disclosed." });
    } catch (error) { next(error); }
  });
}
