import { Express, RequestHandler, Request } from "express";
import { PrismaClient } from "@prisma/client";

type RegistryRequest = Request & { session?: { role: string; institutionId?: string } };
export function registerRegistryRoutes(app: Express, prisma: PrismaClient, guard: RequestHandler) {
  app.get("/api/v1/registry/:resource", guard, async (req: RegistryRequest, res, next) => {
    try {
      const admin = req.session!.role === "ADMIN";
      const institutionId = admin ? undefined : req.session!.institutionId;
      if (!admin && !institutionId) { res.status(403).json({ error: "INSTITUTION_SCOPE_REQUIRED" }); return; }
      const scope = institutionId ? { institutionId } : {};
      const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
      const cursor = req.query.cursor;
      const audit = req.params.resource === "audit";
      if (!Number.isInteger(limit) || limit < 1 || limit > 100 || (cursor !== undefined &&
          (typeof cursor !== "string" || !(audit ? /^[1-9][0-9]{0,17}$/ : /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i).test(cursor)))) {
        res.status(400).json({ error: "INVALID_PAGINATION" }); return;
      }
      const page = { take: limit + 1, ...(cursor ? { cursor: { id: String(cursor) }, skip: 1 } : {}), orderBy: [{ createdAt: "desc" as const }, { id: "desc" as const }] };
      const documentId = req.query.documentId;
      if (documentId !== undefined && (typeof documentId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(documentId))) {
        res.status(400).json({ error: "INVALID_DOCUMENT_ID" }); return;
      }
      let records: unknown[];
      switch (req.params.resource) {
        case "documents":
          records = await prisma.academicDocument.findMany({ where: scope, ...page, select: { id: true, institutionId: true, holderReference: true, originalFileName: true, documentType: true, documentSha256: true, status: true, createdAt: true } }); break;
        case "credentials":
          records = await prisma.credential.findMany({ where: { ...scope, ...(documentId ? { documentId: String(documentId) } : {}) }, ...page, select: { id: true, documentId: true, credentialType: true, subjectReference: true, status: true, issuedAt: true, expiresAt: true, tokenId: true, transactionHash: true, chainId: true } }); break;
        case "audit":
          // Only events recorded by users of this institution are exposed.
          records = await prisma.auditLog.findMany({
            where: admin ? {} : { actor: { institutionId } }, take: limit + 1, orderBy: [{ createdAt: "desc" }, { id: "desc" }], ...(cursor ? { cursor: { id: BigInt(String(cursor)) }, skip: 1 } : {}),
            select: { id: true, action: true, entityType: true, entityId: true, createdAt: true, details: true },
          }); break;
        case "verifications":
          if (!admin) { res.status(403).json({ error: "FORBIDDEN" }); return; }
          records = await prisma.verification.findMany({ ...page, select: { id: true, companyId: true, credentialId: true, decision: true, sourceStatus: true, createdAt: true } }); break;
        case "institutions":
          if (!admin) { res.status(403).json({ error: "FORBIDDEN" }); return; }
          records = await prisma.institution.findMany({ ...page, select: { id: true, name: true, code: true, status: true, country: true } }); break;
        default: res.status(404).json({ error: "RESOURCE_NOT_FOUND" }); return;
      }
      const hasMore = records.length > limit;
      records = records.slice(0, limit);
      const nextCursor = hasMore ? String((records[records.length - 1] as { id: unknown }).id) : null;
      res.set("Cache-Control", "no-store").json(JSON.parse(JSON.stringify({ records, limit, nextCursor }, (_key, value) => typeof value === "bigint" ? value.toString() : value)));
    } catch (error) { next(error); }
  });
  app.get("/api/v1/registry/credentials/:id", guard, async (req: RegistryRequest, res, next) => {
    if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) { res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" }); return; }
    try {
      const credential = await prisma.credential.findFirst({
        where: { id: req.params.id, ...(req.session!.role === "ADMIN" ? {} : { institutionId: req.session!.institutionId }) },
        select: { id: true, documentId: true, credentialType: true, status: true, credentialJson: true, credentialJws: true, issuerDid: true, issuedAt: true, expiresAt: true, revocationReason: true, transactionHash: true, tokenId: true, metadataUri: true },
      });
      if (!credential) { res.status(404).json({ error: "CREDENTIAL_NOT_FOUND" }); return; }
      res.set("Cache-Control", "no-store").json({ records: [credential] });
    } catch (error) { next(error); }
  });
}
