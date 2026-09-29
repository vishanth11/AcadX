ALTER TABLE "User" ADD COLUMN "subjectReference" TEXT;
CREATE UNIQUE INDEX "User_institutionId_subjectReference_key" ON "User"("institutionId", "subjectReference");
CREATE TABLE "ShareGrant" (
  "id" UUID PRIMARY KEY, "ownerId" UUID NOT NULL REFERENCES "User"("id") ON DELETE RESTRICT,
  "tokenHash" CHAR(64) NOT NULL UNIQUE, "credentialIds" UUID[] NOT NULL,
  "purpose" TEXT NOT NULL, "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3), "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "ShareGrant_ownerId_createdAt_idx" ON "ShareGrant"("ownerId", "createdAt");
CREATE TABLE "CredentialOperation" (
  "id" UUID PRIMARY KEY, "credentialId" UUID NOT NULL REFERENCES "Credential"("id") ON DELETE RESTRICT,
  "institutionId" UUID NOT NULL, "actorId" UUID NOT NULL,
  "kind" TEXT NOT NULL CHECK ("kind" IN ('MINT', 'REVOKE')),
  "status" TEXT NOT NULL DEFAULT 'PREPARED' CHECK ("status" IN ('PREPARED','SUBMITTED','CONFIRMED','FAILED')),
  "transactionHash" TEXT, "rawTransaction" TEXT NOT NULL, "chainId" INTEGER NOT NULL,
  "signerAddress" TEXT NOT NULL, "nonce" INTEGER NOT NULL, "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "CredentialOperation_institutionId_status_idx" ON "CredentialOperation"("institutionId", "status");
CREATE UNIQUE INDEX "CredentialOperation_chainId_signerAddress_nonce_key" ON "CredentialOperation"("chainId", "signerAddress", "nonce");
-- A crash or ambiguous RPC failure retains the lock until reconciliation.
CREATE UNIQUE INDEX "CredentialOperation_one_pending" ON "CredentialOperation"("credentialId") WHERE "status" IN ('PREPARED','SUBMITTED');
-- Append-only at the database boundary, including deletes through foreign keys.
CREATE FUNCTION acadshield_audit_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'AuditLog is append-only'; END;
$$;
CREATE TRIGGER audit_append_only BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditLog"
FOR EACH STATEMENT EXECUTE FUNCTION acadshield_audit_append_only();
