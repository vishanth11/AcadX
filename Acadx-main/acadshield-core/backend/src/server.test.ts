import request from "supertest";
import jwt from "jsonwebtoken";
import { app } from "./server";
import { PrismaClient } from "@prisma/client";
jest.mock("@prisma/client", () => {
  const actual = jest.requireActual("@prisma/client");
  const client = { user: { findUnique: jest.fn() } };
  return { ...actual, PrismaClient: jest.fn(() => client) };
});
const client = new PrismaClient();

describe("core API safety defaults", () => {
  const previousJwtSecret = process.env.JWT_SECRET;
  const previousInternalKey = process.env.INTERNAL_SERVICE_API_KEY;
  const previousCorsOrigin = process.env.CORS_ORIGIN;
  const previousBlockchainIssuerKey = process.env.BLOCKCHAIN_ISSUER_PRIVATE_KEY;

  beforeEach(() => {
    delete process.env.JWT_SECRET;
    delete process.env.INTERNAL_SERVICE_API_KEY;
    (client.user.findUnique as jest.Mock).mockResolvedValue(null);
  });

  afterAll(() => {
    if (previousJwtSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousJwtSecret;
    if (previousInternalKey === undefined) delete process.env.INTERNAL_SERVICE_API_KEY;
    else process.env.INTERNAL_SERVICE_API_KEY = previousInternalKey;
    if (previousCorsOrigin === undefined) delete process.env.CORS_ORIGIN;
    else process.env.CORS_ORIGIN = previousCorsOrigin;
    if (previousBlockchainIssuerKey === undefined) delete process.env.BLOCKCHAIN_ISSUER_PRIVATE_KEY;
    else process.env.BLOCKCHAIN_ISSUER_PRIVATE_KEY = previousBlockchainIssuerKey;
  });

  it("reports process health without claiming database readiness", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ status: "UP", service: "acadshield-core-api" });
  });

  it("fails closed when session signing is not configured", async () => {
    const response = await request(app).post("/api/v1/documents");
    expect(response.status).toBe(503);
    expect(response.body.error).toBe("AUTHENTICATION_NOT_CONFIGURED");
  });

  it("fails closed when the internal service credential is not configured", async () => {
    const response = await request(app).post("/api/v1/internal/verify-credential").send({ credentialId: "00000000-0000-4000-8000-000000000001" });
    expect(response.status).toBe(503);
    expect(response.body.error).toBe("INTERNAL_SERVICE_NOT_CONFIGURED");
  });

  it("validates public registration without touching the database", async () => {
    const response = await request(app).post("/api/v1/companies/register").send({
      name: "Example Corp",
      domain: "example.com",
      administratorEmail: "admin@example.com",
      initialPassword: "short",
    });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("INVALID_COMPANY_REQUEST");
  });

  it("keeps template, audit, and registry endpoints behind configured sessions", async () => {
    const audit = await request(app).get("/api/v1/admin/audit");
    const templates = await request(app).get("/api/v1/templates");
    const crossCheck = await request(app).post("/api/v1/documents/00000000-0000-4000-8000-000000000001/cross-check");
    expect(audit.status).toBe(503);
    expect(templates.status).toBe(503);
    expect(crossCheck.status).toBe(503);
  });

  it("keeps NFT minting opt-in and fails closed without an issuer wallet", async () => {
    const secret = "test-only-session-secret-that-is-at-least-32-bytes";
    process.env.JWT_SECRET = secret;
    process.env.CORS_ORIGIN = "http://localhost:3000";
    delete process.env.BLOCKCHAIN_ISSUER_PRIVATE_KEY;
    (client.user.findUnique as jest.Mock).mockResolvedValue({ id: "00000000-0000-4000-8000-000000000003", role: "UNIVERSITY", status: "ACTIVE", institutionId: "00000000-0000-4000-8000-000000000002", institution: { status: "ACTIVE" } });
    const token = jwt.sign({ role: "UNIVERSITY", institutionId: "00000000-0000-4000-8000-000000000002" }, secret, { subject: "00000000-0000-4000-8000-000000000003", issuer: "acadshield-core" });
    const response = await request(app)
      .post("/api/v1/credentials/00000000-0000-4000-8000-000000000001/mint")
      .set("Cookie", `acadshield_session=${token}`)
      .set("Origin", "http://localhost:3000");
    expect(response.status).toBe(503);
    expect(response.body.error).toBe("BLOCKCHAIN_ISSUER_NOT_CONFIGURED");
  });
});
