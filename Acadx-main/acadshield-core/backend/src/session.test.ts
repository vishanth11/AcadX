import request from "supertest";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { app } from "./server";

jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  const client = { user: { findUnique: jest.fn() }, institutionTemplate: { findMany: jest.fn() } };
  return { ...actual, PrismaClient: jest.fn(() => client) };
});
const client = new PrismaClient();
const secret = "phase-one-test-secret-longer-than-thirty-two-bytes";
const original = { ...process.env };
const user = { id: "00000000-0000-4000-8000-000000000003", role: "UNIVERSITY", status: "ACTIVE", institutionId: "00000000-0000-4000-8000-000000000002", companyId: null, institution: { status: "ACTIVE" }, email: "issuer@example.test" };
beforeEach(() => { process.env.JWT_SECRET = secret; });
afterAll(() => { process.env = original; });

it("logs in, then denies the same cookie immediately after suspension", async () => {
  const account = { ...user, passwordHash: await bcrypt.hash("correct-password", 4) };
  (client.user.findUnique as jest.Mock).mockResolvedValue(account);
  (client.institutionTemplate.findMany as jest.Mock).mockResolvedValue([]);
  const login = await request(app).post("/api/v1/auth/login").send({ email: account.email, password: "correct-password" });
  expect(login.status).toBe(200);
  const cookie = login.headers["set-cookie"][0].split(";")[0];
  expect((await request(app).get("/api/v1/templates").set("Cookie", cookie)).status).toBe(200);
  (client.user.findUnique as jest.Mock).mockResolvedValue({ ...account, status: "SUSPENDED" });
  const denied = await request(app).get("/api/v1/templates").set("Cookie", cookie);
  expect(denied.status).toBe(401);
  expect(denied.body.error).toBe("SESSION_REVOKED");
  expect(client.institutionTemplate.findMany).toHaveBeenCalledTimes(1);
});

it("rejects inactive institution login even when the user is active", async () => {
  (client.user.findUnique as jest.Mock).mockResolvedValue({ ...user, institution: { status: "SUSPENDED" }, passwordHash: await bcrypt.hash("correct-password", 4) });
  expect((await request(app).post("/api/v1/auth/login").send({ email: user.email, password: "correct-password" })).status).toBe(401);
});

it("uses database tenancy rather than stale token scope", async () => {
  (client.user.findUnique as jest.Mock).mockResolvedValue(user);
  const token = jwt.sign({ role: user.role, institutionId: "attacker-scope" }, secret, { subject: user.id, issuer: "acadshield-core" });
  const response = await request(app).get("/api/v1/auth/session").set("Authorization", `Bearer ${token}`);
  expect(response.body.user.institutionId).toBe(user.institutionId);
});

it("fails closed if the status database is down", async () => {
  (client.user.findUnique as jest.Mock).mockRejectedValue(new Error("database offline"));
  const token = jwt.sign({ role: user.role }, secret, { subject: user.id, issuer: "acadshield-core" });
  expect((await request(app).get("/api/v1/templates").set("Authorization", `Bearer ${token}`)).status).toBe(500);
  expect(client.institutionTemplate.findMany).not.toHaveBeenCalled();
});
it("revokes student sessions when their institution is suspended", async () => {
  (client.user.findUnique as jest.Mock).mockResolvedValue({ ...user, role: "STUDENT", institution: { status: "SUSPENDED" } });
  const token = jwt.sign({ role: "STUDENT" }, secret, { subject: user.id, issuer: "acadshield-core" });
  expect((await request(app).get("/api/v1/student/profile").set("Authorization", `Bearer ${token}`)).status).toBe(401);
});
