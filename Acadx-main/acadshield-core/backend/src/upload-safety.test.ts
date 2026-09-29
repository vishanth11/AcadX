import request from "supertest";
import jwt from "jsonwebtoken";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { reconcileUploads } from "./reconcile-uploads";

jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  const client = {
    user: { findUnique: jest.fn() },
    academicDocument: { create: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), findMany: jest.fn(), updateMany: jest.fn() },
    institutionTemplate: { findFirst: jest.fn() }, auditLog: { create: jest.fn() },
  };
  return { ...actual, PrismaClient: jest.fn(() => client) };
});
const original = { ...process.env };
const storage = fs.mkdtempSync(path.join(os.tmpdir(), "acadshield-upload-test-"));
process.env.DOCUMENT_STORAGE_DIR = storage;
const { app } = require("./server");
const client = new PrismaClient();
const institutionId = "00000000-0000-4000-8000-000000000002";
const id = "00000000-0000-4000-8000-000000000003";
const secret = "upload-test-secret-longer-than-thirty-two-bytes";
const token = jwt.sign({ role: "UNIVERSITY" }, secret, { subject: id, issuer: "acadshield-core" });
const upload = () => request(app).post("/api/v1/documents").set("Authorization", `Bearer ${token}`).attach("file", Buffer.from("%PDF-1.7 example"), "example.pdf");
const files = () => fs.existsSync(path.join(storage, institutionId)) ? fs.readdirSync(path.join(storage, institutionId)) : [];
beforeEach(() => {
  process.env.ALLOW_UNSCANNED_UPLOADS = "true";
  process.env.JWT_SECRET = secret;
  delete process.env.AI_SERVICE_URL;
  (client.user.findUnique as jest.Mock).mockResolvedValue({ id, role: "UNIVERSITY", status: "ACTIVE", institutionId, institution: { status: "ACTIVE" } });
  (client.academicDocument.findUnique as jest.Mock).mockResolvedValue(null);
  (client.academicDocument.create as jest.Mock).mockImplementation(async ({ data }) => data);
  (client.academicDocument.findMany as jest.Mock).mockResolvedValue([]);
  (client.auditLog.create as jest.Mock).mockResolvedValue({});
});
afterEach(() => {
  // Only fixture files beneath this test's freshly allocated temp directory.
  for (const file of files()) fs.unlinkSync(path.join(storage, institutionId, file));
});
afterAll(() => { process.env = original; fs.rmSync(storage, { recursive: true }); });

it("removes uploaded bytes after a confirmed failed DB creation", async () => {
  (client.academicDocument.create as jest.Mock).mockRejectedValue(new Error("DB rejected insert"));
  expect((await upload()).status).toBe(500);
  expect(files()).toHaveLength(0);
});
it("retains a registered review record when optional AI analysis fails", async () => {
  process.env.AI_SERVICE_URL = "http://ai.test";
  process.env.AI_SERVICE_API_KEY = "test-key";
  jest.spyOn(global, "fetch").mockRejectedValue(new Error("AI offline"));
  const response = await upload();
  expect(response.status).toBe(201);
  expect(response.body.analysis.status).toBe("UNAVAILABLE");
  expect(client.academicDocument.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: "REVIEW_REQUIRED" }) }));
  expect(files()).toHaveLength(1);
});
it("does not delete committed bytes after an audit failure", async () => {
  (client.auditLog.create as jest.Mock).mockRejectedValue(new Error("audit offline"));
  (client.academicDocument.findUnique as jest.Mock).mockResolvedValue({ id });
  expect((await upload()).status).toBe(500);
  expect(files()).toHaveLength(1);
});
it("defers uncertain commits to reconciliation", async () => {
  (client.academicDocument.create as jest.Mock).mockRejectedValue(new Error("connection lost"));
  (client.academicDocument.findUnique as jest.Mock).mockRejectedValue(new Error("DB offline"));
  expect((await upload()).status).toBe(500);
  expect(files()).toHaveLength(1);
});
it("reconciles only old unreferenced files, retaining recent and registered files", async () => {
  fs.mkdirSync(path.join(storage, institutionId), { recursive: true });
  const ids = ["00000000-0000-4000-8000-000000000010", "00000000-0000-4000-8000-000000000011", "00000000-0000-4000-8000-000000000012"];
  for (const value of ids) fs.writeFileSync(path.join(storage, institutionId, value + ".bin"), "fixture");
  for (const value of ids.slice(0, 2)) fs.utimesSync(path.join(storage, institutionId, value + ".bin"), new Date(0), new Date(0));
  (client.academicDocument.findFirst as jest.Mock).mockImplementation(async ({ where }) => where.OR[0].id === ids[1] ? { id: ids[1] } : null);
  (client.academicDocument.findMany as jest.Mock).mockResolvedValue([{ id }]);
  const preview = await reconcileUploads(client, storage);
  expect(preview.orphanFiles).toHaveLength(1);
  expect(files()).toHaveLength(3);
  expect(client.academicDocument.updateMany).not.toHaveBeenCalled();
  await reconcileUploads(client, storage, true);
  expect(files()).toHaveLength(2);
  expect(client.academicDocument.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: "PROCESSING" }), data: expect.objectContaining({ status: "FAILED" }) }));
});
