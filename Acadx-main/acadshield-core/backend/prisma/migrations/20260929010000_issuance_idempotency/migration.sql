ALTER TABLE "Credential" ADD COLUMN "issuanceKey" UUID;
ALTER TABLE "Credential" ADD COLUMN "issuanceRequestHash" CHAR(64);
CREATE UNIQUE INDEX "Credential_institutionId_issuanceKey_key" ON "Credential"("institutionId", "issuanceKey");
