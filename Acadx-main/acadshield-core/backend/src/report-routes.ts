import { Express, Request, RequestHandler } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

export function registerReportRoutes(app: Express, prisma: PrismaClient, guard: RequestHandler) {
  app.get("/api/v1/company/reports", guard, async (req: Request & { session?: { companyId?: string } }, res, next) => {
    const query = z.object({ cursor: z.string().uuid().optional(), from: z.string().datetime().optional(), to: z.string().datetime().optional() }).strict().safeParse(req.query);
    if (!query.success || (query.data.from && query.data.to && new Date(query.data.from) > new Date(query.data.to))) { res.status(400).json({ error: "INVALID_REPORT_FILTER" }); return; }
    const companyId = req.session?.companyId;
    if (!companyId) { res.status(403).json({ error: "COMPANY_SCOPE_REQUIRED" }); return; }
    try {
      const { cursor, from, to } = query.data;
      const rows = await prisma.verification.findMany({ where: { companyId, ...(from || to ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } } : {}) }, take: 51, ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}), orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: { id: true, credentialId: true, decision: true, sourceStatus: true, createdAt: true } });
      res.set("Cache-Control", "no-store").json({ records: rows.slice(0, 50), limit: 50, nextCursor: rows.length > 50 ? rows[49].id : null });
    } catch (error) { next(error); }
  });
  app.get("/api/v1/company/reports/:id", guard, async (req: Request & { session?: { companyId?: string; userId: string } }, res, next) => {
    if (!req.session?.companyId) { res.status(403).json({ error: "COMPANY_SCOPE_REQUIRED" }); return; }
    if (!z.string().uuid().safeParse(req.params.id).success) { res.status(404).json({ error: "REPORT_NOT_FOUND" }); return; }
    try {
      // Use the historical evidence, not today's mutable credential details.
      const row = await prisma.verification.findFirst({ where: { id: req.params.id, companyId: req.session.companyId }, select: { id: true, credentialId: true, decision: true, deterministicEvidence: true, aiEvidence: true, sourceStatus: true, createdAt: true } });
      if (!row) { res.status(404).json({ error: "REPORT_NOT_FOUND" }); return; }
      await prisma.auditLog.create({ data: { actorId: req.session.userId, action: "EMPLOYER_REPORT_EXPORTED", entityType: "Verification", entityId: row.id } });
      res.set({ "Cache-Control": "no-store", "Content-Disposition": `attachment; filename="verification-${row.id}.json"` }).json({ schemaVersion: "1.0", generatedAt: new Date().toISOString(), verification: row, note: "Historical verification snapshot, not a current validity guarantee. AI evidence is advisory. Reverify for current lifecycle status." });
    } catch (error) { next(error); }
  });
}
