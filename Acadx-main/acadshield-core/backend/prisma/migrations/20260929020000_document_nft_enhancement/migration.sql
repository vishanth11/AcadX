-- AlterTable
ALTER TABLE "AcademicDocument" ADD COLUMN "credentialId" UUID;
ALTER TABLE "AcademicDocument" ADD COLUMN "vcId" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "ipfsCid" VARCHAR(120);
ALTER TABLE "AcademicDocument" ADD COLUMN "tokenId" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "contractAddress" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "transactionHash" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "blockNumber" BIGINT;
ALTER TABLE "AcademicDocument" ADD COLUMN "chainId" INTEGER;
ALTER TABLE "AcademicDocument" ADD COLUMN "network" TEXT DEFAULT 'Polygon Amoy';
ALTER TABLE "AcademicDocument" ADD COLUMN "issuerWallet" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "holderWallet" TEXT;
ALTER TABLE "AcademicDocument" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED';
ALTER TABLE "AcademicDocument" ADD COLUMN "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "AcademicDocument" ADD COLUMN "nftStatus" TEXT NOT NULL DEFAULT 'NOT_MINTED';

-- AlterTable
ALTER TABLE "Credential" ADD COLUMN "vcId" TEXT;
ALTER TABLE "Credential" ADD COLUMN "network" TEXT DEFAULT 'Polygon Amoy';
ALTER TABLE "Credential" ADD COLUMN "issuerWallet" TEXT;
ALTER TABLE "Credential" ADD COLUMN "holderWallet" TEXT;
ALTER TABLE "Credential" ADD COLUMN "verificationStatus" TEXT NOT NULL DEFAULT 'VERIFIED';
ALTER TABLE "Credential" ADD COLUMN "lifecycleStatus" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Credential" ADD COLUMN "nftStatus" TEXT NOT NULL DEFAULT 'NOT_MINTED';

-- CreateIndex
CREATE INDEX "AcademicDocument_tokenId_idx" ON "AcademicDocument"("tokenId");
CREATE INDEX "AcademicDocument_transactionHash_idx" ON "AcademicDocument"("transactionHash");
