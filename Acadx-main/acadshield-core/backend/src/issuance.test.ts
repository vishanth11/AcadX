import request from "supertest";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { app } from "./server";
jest.mock("@prisma/client", () => {
  const client = { user: { findUnique: jest.fn() }, credential: { findFirst: jest.fn() } };
  return { ...jest.requireActual("@prisma/client"), PrismaClient: jest.fn(() => client) };
});
const client = new PrismaClient();
const original = { ...process.env };
const id = "00000000-0000-4000-8000-000000000001";
const payload = { documentId: id, credentialType: "Degree", subjectDid: "did:test:student", credentialSubject: {} };
let token: string;
beforeEach(() => {
  process.env.JWT_SECRET = "issuance-test-secret-longer-than-thirty-two-characters";
  process.env.VC_ISSUER_DID = "did:test:issuer";
  process.env.VC_ISSUER_KEY_ID = "did:test:issuer#key";
  process.env.VC_ISSUER_PRIVATE_KEY_PEM = "not-used-for-replay";
  process.env.VC_ISSUER_INSTITUTION_ID = id;
  token = jwt.sign({ role: "UNIVERSITY" }, process.env.JWT_SECRET, { subject: id, issuer: "acadshield-core" });
  (client.user.findUnique as jest.Mock).mockResolvedValue({ id, role: "UNIVERSITY", status: "ACTIVE", institutionId: id, institution: { status: "ACTIVE" } });
});
afterAll(() => { process.env = original; });
it("requires an idempotency key before attempting issuance", async () => {
  const response = await request(app).post("/api/v1/credentials").set("Authorization", `Bearer ${token}`).send(payload);
  expect(response.status).toBe(400); expect(response.body.error).toBe("IDEMPOTENCY_KEY_REQUIRED");
  expect(client.credential.findFirst).not.toHaveBeenCalled();
});
it("recovers the existing issuance without signing or inserting again", async () => {
  (client.credential.findFirst as jest.Mock).mockResolvedValue({ id, status: "ACTIVE", issuerDid: "did:test:issuer", issuanceRequestHash: crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex") });
  const response = await request(app).post("/api/v1/credentials").set("Authorization", `Bearer ${token}`).set("Idempotency-Key", id).send(payload);
  expect(response.status).toBe(200); expect(response.body.credentialId).toBe(id); expect(response.body.replayed).toBe(true);
  expect(client.credential.findFirst).toHaveBeenCalledWith({ where: { institutionId: id, issuanceKey: id } });
});
it("rejects key reuse with a changed request", async () => {
  (client.credential.findFirst as jest.Mock).mockResolvedValue({ issuanceRequestHash: "different" });
  expect((await request(app).post("/api/v1/credentials").set("Authorization", `Bearer ${token}`).set("Idempotency-Key", id).send(payload)).status).toBe(409);
});
