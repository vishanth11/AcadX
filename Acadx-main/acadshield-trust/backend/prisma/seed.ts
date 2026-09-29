import "dotenv/config";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const rawKey = process.env.TRUST_API_KEY;
  const companyId = process.env.TRUST_API_COMPANY_ID;
  if (!rawKey || !companyId) {
    console.log("No company API key seeded; set TRUST_API_KEY and TRUST_API_COMPANY_ID to provision one.");
    return;
  }
  if (rawKey.length < 32 || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId)) {
    throw new Error("TRUST_API_KEY must be at least 32 characters and TRUST_API_COMPANY_ID must be a UUID.");
  }
  const tokenHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  await prisma.companyApiKey.upsert({
    where: { tokenHash },
    update: { companyId, name: "Environment provisioned key", status: "ACTIVE", scopes: ["credential:verify", "verification:read"] },
    create: { companyId, name: "Environment provisioned key", tokenHash, scopes: ["credential:verify", "verification:read"] },
  });
  console.log("Company API key hash provisioned.");
}

main().finally(() => prisma.$disconnect());
