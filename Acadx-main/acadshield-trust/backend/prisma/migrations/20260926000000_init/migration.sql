-- CreateEnum
CREATE TYPE "ApiKeyStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateTable
CREATE TABLE "CompanyApiKey" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" CHAR(64) NOT NULL,
    "status" "ApiKeyStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dailyQuota" INTEGER NOT NULL DEFAULT 1000,
    "usedToday" INTEGER NOT NULL DEFAULT 0,
    "quotaResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationRecord" (
    "id" UUID NOT NULL,
    "companyId" UUID NOT NULL,
    "apiKeyId" UUID,
    "credentialId" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "submittedSha256" CHAR(64) NOT NULL,
    "sourceEvidence" JSONB NOT NULL,
    "aiEvidence" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyApiKey_tokenHash_key" ON "CompanyApiKey"("tokenHash");

-- CreateIndex
CREATE INDEX "CompanyApiKey_companyId_status_idx" ON "CompanyApiKey"("companyId", "status");

-- CreateIndex
CREATE INDEX "VerificationRecord_companyId_createdAt_idx" ON "VerificationRecord"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "VerificationRecord_credentialId_createdAt_idx" ON "VerificationRecord"("credentialId", "createdAt");

-- AddForeignKey
ALTER TABLE "VerificationRecord" ADD CONSTRAINT "VerificationRecord_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "CompanyApiKey"("id") ON DELETE SET NULL ON UPDATE CASCADE;

