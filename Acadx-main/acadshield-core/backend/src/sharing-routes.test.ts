import express from "express";
import request from "supertest";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { registerSharingRoutes } from "./sharing-routes";
import { registerReportRoutes } from "./report-routes";

const id = "00000000-0000-4000-8000-000000000001";
const other = "00000000-0000-4000-8000-000000000002";
const client = {
  user: { findUnique: jest.fn(), create: jest.fn() }, credential: { findMany: jest.fn(), findFirst: jest.fn() }, academicDocument: { findMany: jest.fn() },
  shareGrant: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
  verification: { findMany: jest.fn(), findFirst: jest.fn() }, auditLog: { create: jest.fn() }, $transaction: jest.fn(),
};
const app = express(); app.use(express.json());
const guard: express.RequestHandler = (req, _res, next) => { Object.assign(req, { session: { userId: id, institutionId: other, companyId: other } }); next(); };
registerSharingRoutes(app, client as unknown as PrismaClient, guard, guard);
registerReportRoutes(app, client as unknown as PrismaClient, guard);
app.use((_error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => res.status(500).json({ error: "INTERNAL" }));
const shareBody = () => ({ credentialIds: [id], purpose: "Employer review", consent: true, expiresAt: new Date(Date.now() + 86400000).toISOString() });
beforeEach(() => {
  client.$transaction.mockImplementation(async fn => fn(client));
  client.user.findUnique.mockResolvedValue({ id, institutionId: other, subjectReference: "did:test:student", status: "ACTIVE" });
  client.credential.findMany.mockResolvedValue([{ id }]);
  client.shareGrant.create.mockResolvedValue({ id });
  client.auditLog.create.mockResolvedValue({ id: 1 });
});
it("requires explicit consent and bounded expiry without creating a share", async () => {
  for (const body of [{ ...shareBody(), consent: false }, { ...shareBody(), expiresAt: new Date(0).toISOString() }, { ...shareBody(), credentialIds: [id, id] }]) {
    expect((await request(app).post("/api/v1/student/shares").send(body)).status).toBe(400);
  }
  expect(client.shareGrant.create).not.toHaveBeenCalled();
});
it("denies IDs not owned by the enrolled student", async () => {
  client.credential.findMany.mockResolvedValue([]);
  expect((await request(app).post("/api/v1/student/shares").send(shareBody())).status).toBe(403);
  expect(client.credential.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ institutionId: other, subjectReference: "did:test:student", status: "ACTIVE" }) }));
  expect(client.shareGrant.create).not.toHaveBeenCalled();
});
it("stores only a token hash and commits consent with the grant", async () => {
  const response = await request(app).post("/api/v1/student/shares").send(shareBody());
  expect(response.status).toBe(201);
  expect(response.body.token).toMatch(/^[\w-]{43}$/);
  const data = client.shareGrant.create.mock.calls[0][0].data;
  expect(data.tokenHash).toBe(crypto.createHash("sha256").update(response.body.token).digest("hex"));
  expect(JSON.stringify(client.auditLog.create.mock.calls)).not.toContain(response.body.token);
  expect(client.$transaction).toHaveBeenCalledTimes(1);
});
it.each(["expired", "revoked", "suspended", "issuer-suspended"])("denies %s share resolution", async condition => {
  client.shareGrant.findUnique.mockResolvedValue({ id, expiresAt: new Date(condition === "expired" ? 0 : Date.now() + 86400000), revokedAt: condition === "revoked" ? new Date() : null, owner: { status: condition === "suspended" ? "SUSPENDED" : "ACTIVE", subjectReference: "did:test:student", institution: { status: condition === "issuer-suspended" ? "SUSPENDED" : "ACTIVE" } } });
  expect((await request(app).post("/api/v1/shares/resolve").send({ token: "a".repeat(43) })).status).toBe(404);
  expect(client.credential.findMany).not.toHaveBeenCalled();
});
it("scopes resolution to current ownership and reports effective expiry", async () => {
  client.shareGrant.findUnique.mockResolvedValue({ id, credentialIds: [id], expiresAt: new Date(Date.now() + 86400000), owner: { status: "ACTIVE", institutionId: other, subjectReference: "did:test:student", institution: { status: "ACTIVE" } } });
  client.credential.findMany.mockResolvedValue([{ id, status: "ACTIVE", expiresAt: new Date(0) }]);
  const response = await request(app).post("/api/v1/shares/resolve").send({ token: "a".repeat(43) });
  expect(response.status).toBe(200); expect(response.body.records[0].status).toBe("EXPIRED");
  expect(response.headers["cache-control"]).toBe("no-store");
  const query = client.credential.findMany.mock.calls[0][0];
  expect(query.select.credentialJson).toBeUndefined(); expect(query.select.subjectReference).toBeUndefined();
  expect(query.where.institutionId).toBe(other);
});
it("revocation is owner-scoped and audited atomically", async () => {
  client.shareGrant.updateMany.mockResolvedValue({ count: 1 });
  expect((await request(app).post(`/api/v1/student/shares/${id}/revoke`)).status).toBe(200);
  expect(client.shareGrant.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id, ownerId: id, revokedAt: null } }));
  expect(client.auditLog.create).toHaveBeenCalled();
});
it("exports only a company's historical verification evidence", async () => {
  client.verification.findFirst.mockResolvedValue({ id, decision: "REVOKED", deterministicEvidence: { hashMatches: true } });
  const response = await request(app).get(`/api/v1/company/reports/${id}`);
  expect(response.status).toBe(200); expect(response.body.verification.decision).toBe("REVOKED");
  expect(client.verification.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id, companyId: other } }));
  expect(response.headers["content-disposition"]).toContain("attachment");
  client.verification.findFirst.mockResolvedValue(null);
  expect((await request(app).get(`/api/v1/company/reports/${other}`)).status).toBe(404);
});
it("enrollment does not accept caller-supplied institution or role", async () => {
  expect((await request(app).post("/api/v1/students").send({ email: "student@example.test", password: "long-password-123", subjectReference: "did:test:student", institutionId: id, role: "ADMIN" })).status).toBe(400);
  expect(client.user.create).not.toHaveBeenCalled();
});
it("does not expose another student's credential detail", async () => {
  client.credential.findFirst.mockResolvedValue(null);
  expect((await request(app).get(`/api/v1/student/credentials/${other}`)).status).toBe(404);
  expect(client.credential.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: other, institutionId: other, subjectReference: "did:test:student" } }));
});
it("limits student document metadata to enrolled credential ownership", async () => {
  client.academicDocument.findMany.mockResolvedValue([]);
  expect((await request(app).get("/api/v1/student/documents")).status).toBe(200);
  const query = client.academicDocument.findMany.mock.calls[0][0];
  expect(query.where).toEqual({ institutionId: other, credentials: { some: { institutionId: other, subjectReference: "did:test:student" } } });
  expect(query.select.storageReference).toBeUndefined(); expect(query.select.extractedFields).toBeUndefined();
});
