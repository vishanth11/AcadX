import request from "supertest";
import axios from "axios";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { app } from "./server";
jest.mock("axios");
jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  const client = { companyApiKey: { findUnique: jest.fn() }, $queryRaw: jest.fn(), verificationRecord: { create: jest.fn(), findMany: jest.fn(), findFirst: jest.fn() } };
  return { ...actual, PrismaClient: jest.fn(() => client) };
});
const client = new PrismaClient();
const original = { ...process.env };
const key = { id: "00000000-0000-4000-8000-000000000001", companyId: "00000000-0000-4000-8000-000000000002", status: "ACTIVE", scopes: ["credential:verify", "verification:read"], expiresAt: null, dailyQuota: 1, usedToday: 0 };
const valid = () => request(app).post("/api/v1/verify/credential").set("X-API-Key", "test-key").field("credentialId", key.id).attach("file", Buffer.from("%PDF-1.7 test"), "document.pdf");
beforeEach(() => {
  jest.resetAllMocks();
  process.env.PROJECT_A_API_URL = "http://core.test/api/v1";
  process.env.PROJECT_A_INTERNAL_API_KEY = "test-internal-key";
  delete process.env.AI_SERVICE_URL;
  (client.companyApiKey.findUnique as jest.Mock).mockResolvedValue(key);
  (client.$queryRaw as jest.Mock).mockResolvedValue([{ id: key.id }]);
  (client.verificationRecord.create as jest.Mock).mockResolvedValue({ id: "verification" });
  (client.verificationRecord.findMany as jest.Mock).mockResolvedValue([]);
  (axios.post as jest.Mock).mockResolvedValue({ data: { decision: "VERIFIED", sourceStatus: "REGISTERED" } });
  (axios.get as jest.Mock).mockResolvedValue({ data: { companyId: key.companyId, status: "ACTIVE" } });
});
afterAll(() => { process.env = original; });
it("scopes report exports and does not consume verification quota", async () => {
  (client.verificationRecord.findFirst as jest.Mock).mockResolvedValue({ id: key.id, decision: "VERIFIED" });
  const response = await request(app).get(`/api/v1/reports/${key.id}`).set("X-API-Key", "test-key");
  expect(response.status).toBe(200);
  expect(client.verificationRecord.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: key.id, companyId: key.companyId } }));
  expect(client.$queryRaw).not.toHaveBeenCalled();
  (client.verificationRecord.findFirst as jest.Mock).mockResolvedValue(null);
  expect((await request(app).get(`/api/v1/reports/${key.id}`).set("X-API-Key", "test-key")).status).toBe(404);
});
it("rejects invalid pagination without charging quota", async () => {
  expect((await request(app).get("/api/v1/verifications?cursor=bad").set("X-API-Key", "test-key")).status).toBe(400);
  expect(client.$queryRaw).not.toHaveBeenCalled(); expect(client.verificationRecord.findMany).not.toHaveBeenCalled();
});
it("does not charge malformed requests", async () => {
  expect((await request(app).post("/api/v1/verify/credential").set("X-API-Key", "test-key").send({ credentialId: "invalid" })).status).toBe(400);
  expect(client.$queryRaw).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
});
it("does not charge unsupported files", async () => {
  expect((await request(app).post("/api/v1/verify/credential").set("X-API-Key", "test-key").field("credentialId", key.id).attach("file", Buffer.from("bad"), "bad.pdf")).status).toBe(415);
  expect(client.$queryRaw).not.toHaveBeenCalled();
});
it("does not charge reads even when quota is exhausted", async () => {
  (client.companyApiKey.findUnique as jest.Mock).mockResolvedValue({ ...key, usedToday: 1 });
  expect((await request(app).get("/api/v1/verifications").set("X-API-Key", "test-key")).status).toBe(200);
  expect(client.$queryRaw).not.toHaveBeenCalled();
});
it("charges once before successful verification", async () => {
  expect((await valid()).status).toBe(201);
  expect(client.$queryRaw).toHaveBeenCalledTimes(1);
  expect((client.$queryRaw as jest.Mock).mock.invocationCallOrder[0]).toBeLessThan((axios.post as jest.Mock).mock.invocationCallOrder[0]);
});
it("rejects expired keys without charging", async () => {
  (client.companyApiKey.findUnique as jest.Mock).mockResolvedValue({ ...key, expiresAt: new Date(0) });
  expect((await valid()).status).toBe(401);
  expect(client.$queryRaw).not.toHaveBeenCalled();
});
it("rejects exhausted quota before contacting Core", async () => {
  (client.$queryRaw as jest.Mock).mockResolvedValue([]);
  expect((await valid()).status).toBe(429);
  expect(axios.post).not.toHaveBeenCalled();
});
it("does not charge when the verifier is unconfigured", async () => {
  delete process.env.PROJECT_A_INTERNAL_API_KEY;
  expect((await valid()).status).toBe(503);
  expect(client.$queryRaw).not.toHaveBeenCalled();
});
it("denies a suspended company API key before charging", async () => {
  (axios.get as jest.Mock).mockResolvedValue({ data: { companyId: key.companyId, status: "SUSPENDED" } });
  expect((await valid()).status).toBe(403);
  expect(client.$queryRaw).not.toHaveBeenCalled();
  expect(axios.post).not.toHaveBeenCalled();
});
it("fails closed when live company status cannot be checked", async () => {
  (axios.get as jest.Mock).mockRejectedValue(new Error("Core offline"));
  expect((await valid()).status).toBe(503);
  expect(client.$queryRaw).not.toHaveBeenCalled();
});
it("denies a formerly valid company session after Core suspension", async () => {
  process.env.JWT_SECRET = "test-secret-longer-than-thirty-two-characters";
  const token = jwt.sign({ role: "COMPANY", companyId: key.companyId }, process.env.JWT_SECRET, { issuer: "acadshield-core", subject: key.id });
  (axios.get as jest.Mock).mockResolvedValueOnce({ data: { user: { role: "COMPANY", companyId: key.companyId } } });
  expect((await request(app).get("/api/v1/verifications").set("Authorization", `Bearer ${token}`)).status).toBe(200);
  (axios.get as jest.Mock).mockRejectedValueOnce({ response: { status: 401 } });
  (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
  expect((await request(app).get("/api/v1/verifications").set("Authorization", `Bearer ${token}`)).status).toBe(401);
});
