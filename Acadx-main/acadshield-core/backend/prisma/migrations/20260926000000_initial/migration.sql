-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'UNIVERSITY', 'COMPANY', 'STUDENT');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DISABLED');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'PROCESSING', 'REVIEW_REQUIRED', 'VERIFIED', 'MISMATCH', 'FAILED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('DRAFT', 'ACTIVE', 'REVOKED', 'EXPIRED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "VerificationDecision" AS ENUM ('VERIFIED', 'REVIEW_REQUIRED', 'MISMATCH', 'REVOKED', 'EXPIRED', 'INVALID', 'SOURCE_UNAVAILABLE', 'PROCESSING', 'FAILED');

-- CreateTable
CREATE TABLE "Institution" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "country" TEXT,
    "website" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'PENDING',
    "institutionId" UUID,
    "companyId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicDocument" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "holderReference" TEXT,
    "originalFileName" TEXT NOT NULL,
    "mediaType" TEXT NOT NULL,
    "sizeBytes" BIGINT NOT NULL,
    "storageReference" TEXT NOT NULL,
    "documentSha256" CHAR(64) NOT NULL,
    "contentFingerprint" CHAR(64),
    "documentType" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
    "ocrEvidence" JSONB,
    "extractedFields" JSONB,
    "analysisEvidence" JSONB,
    "uploadedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AcademicDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "documentId" UUID,
    "credentialType" TEXT NOT NULL,
    "subjectReference" TEXT NOT NULL,
    "issuerDid" TEXT NOT NULL,
    "credentialJson" JSONB NOT NULL,
    "credentialJws" TEXT,
    "credentialSha256" CHAR(64) NOT NULL,
    "status" "CredentialStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "supersedesId" UUID,
    "chainId" INTEGER,
    "contractAddress" TEXT,
    "tokenId" TEXT,
    "transactionHash" TEXT,
    "blockNumber" BIGINT,
    "mintedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" UUID NOT NULL,
    "credentialId" UUID,
    "documentId" UUID,
    "companyId" UUID,
    "decision" "VerificationDecision" NOT NULL,
    "deterministicEvidence" JSONB NOT NULL,
    "aiEvidence" JSONB,
    "sourceStatus" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InstitutionTemplate" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "documentType" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "templateName" TEXT NOT NULL,
    "expectedFields" JSONB NOT NULL,
    "expectedRegions" JSONB,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InstitutionTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" BIGSERIAL NOT NULL,
    "actorId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "requestId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApiKey" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "keyHash" CHAR(64) NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "scopes" TEXT[],
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_code_key" ON "Institution"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_institutionId_role_idx" ON "User"("institutionId", "role");

-- CreateIndex
CREATE INDEX "User_companyId_role_idx" ON "User"("companyId", "role");

-- CreateIndex
CREATE INDEX "AcademicDocument_institutionId_createdAt_idx" ON "AcademicDocument"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "AcademicDocument_documentSha256_idx" ON "AcademicDocument"("documentSha256");

-- CreateIndex
CREATE INDEX "AcademicDocument_contentFingerprint_idx" ON "AcademicDocument"("contentFingerprint");

-- CreateIndex
CREATE INDEX "Credential_institutionId_status_idx" ON "Credential"("institutionId", "status");

-- CreateIndex
CREATE INDEX "Credential_credentialSha256_idx" ON "Credential"("credentialSha256");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_chainId_contractAddress_tokenId_key" ON "Credential"("chainId", "contractAddress", "tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "Verification_requestId_key" ON "Verification"("requestId");

-- CreateIndex
CREATE INDEX "Verification_credentialId_createdAt_idx" ON "Verification"("credentialId", "createdAt");

-- CreateIndex
CREATE INDEX "Verification_companyId_createdAt_idx" ON "Verification"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "InstitutionTemplate_institutionId_documentType_active_idx" ON "InstitutionTemplate"("institutionId", "documentType", "active");

-- CreateIndex
CREATE UNIQUE INDEX "InstitutionTemplate_institutionId_documentType_version_key" ON "InstitutionTemplate"("institutionId", "documentType", "version");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_createdAt_idx" ON "AuditLog"("entityType", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_createdAt_idx" ON "AuditLog"("actorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_keyHash_key" ON "ApiKey"("keyHash");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AcademicDocument" ADD CONSTRAINT "AcademicDocument_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AcademicDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_supersedesId_fkey" FOREIGN KEY ("supersedesId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "AcademicDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstitutionTemplate" ADD CONSTRAINT "InstitutionTemplate_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

