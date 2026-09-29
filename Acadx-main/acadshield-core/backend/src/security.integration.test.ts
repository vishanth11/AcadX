import { PrismaClient } from "@prisma/client";
import crypto from "node:crypto";
import { Wallet } from "ethers";
import { prepareOperation } from "./credential-operations";

// Explicit opt-in and a dedicated test database are mandatory. Never clean user data.
const url = process.env.INTEGRATION_DATABASE_URL;
const enabled = Boolean(url && /_test$/.test(new URL(url).pathname));
if (url && !enabled) throw new Error("Integration database name must end with _test");
const integration = enabled ? describe : describe.skip;
integration("PostgreSQL security constraints", () => {
  const prisma = new PrismaClient({ datasources: { db: { url: url || "postgresql://invalid/disabled_test" } } });
  afterAll(async () => { await prisma.$disconnect(); });
  it("rejects audit update, delete and truncate at the database boundary", async () => {
    const row = await prisma.auditLog.create({ data: { action: "INTEGRATION_TEST", entityType: "Test" } });
    await expect(prisma.auditLog.update({ where: { id: row.id }, data: { action: "TAMPER" } })).rejects.toThrow("append-only");
    await expect(prisma.auditLog.delete({ where: { id: row.id } })).rejects.toThrow("append-only");
    await expect(prisma.$executeRaw`TRUNCATE "AuditLog"`).rejects.toThrow("append-only");
    expect((await prisma.auditLog.findUnique({ where: { id: row.id } }))?.action).toBe("INTEGRATION_TEST");
  });
  it("permits only one pending operation under concurrent insertions", async () => {
    const institution = await prisma.institution.create({ data: { name: "Integration test", code: crypto.randomUUID(), status: "ACTIVE" } });
    const credential = await prisma.credential.create({ data: { institutionId: institution.id, credentialType: "Test", subjectReference: "did:test:subject", issuerDid: "did:test:issuer", credentialJson: {}, credentialSha256: "a".repeat(64), status: "ACTIVE" } });
    const data = { credentialId: credential.id, institutionId: institution.id, actorId: crypto.randomUUID(), kind: "MINT", chainId: 31337, signerAddress: crypto.randomUUID(), rawTransaction: "0xab", details: {} };
    const results = await Promise.allSettled([0, 1].map(nonce => prisma.credentialOperation.create({ data: { ...data, nonce } })));
    expect(results.filter(result => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter(result => result.status === "rejected")).toHaveLength(1);
  });
  it("prevents two accounts from claiming the same institution subject", async () => {
    const institution = await prisma.institution.create({ data: { name: "Ownership test", code: crypto.randomUUID() } });
    const data = { institutionId: institution.id, role: "STUDENT" as const, passwordHash: "not-a-login", subjectReference: "did:test:shared" };
    await prisma.user.create({ data: { ...data, email: `${crypto.randomUUID()}@example.test` } });
    await expect(prisma.user.create({ data: { ...data, email: `${crypto.randomUUID()}@example.test` } })).rejects.toMatchObject({ code: "P2002" });
  });
  it("serializes signer nonce reservations across simultaneous operations", async () => {
    const institution = await prisma.institution.create({ data: { name: "Nonce test", code: crypto.randomUUID(), status: "ACTIVE" } });
    const credentials = await Promise.all([1, 2].map(() => prisma.credential.create({ data: { institutionId: institution.id, credentialType: "Test", subjectReference: "did:test:subject", issuerDid: "did:test:issuer", credentialJson: {}, credentialSha256: "b".repeat(64), status: "ACTIVE" } })));
    const signer = { address: Wallet.createRandom().address, getNonce: async () => 3, populateTransaction: async (value: unknown) => value, signTransaction: async () => "0xab" } as unknown as Wallet;
    const operations = await Promise.all(credentials.map(credential => prepareOperation(prisma, signer, { credentialId: credential.id, institutionId: institution.id, actorId: crypto.randomUUID(), kind: "MINT", chainId: 31337, details: { contractAddress: "0x" + "11".repeat(20), reference: "0x" + "22".repeat(32) }, transaction: {} })));
    expect(operations.map(row => row.nonce).sort()).toEqual([3, 4]);
  });
});
