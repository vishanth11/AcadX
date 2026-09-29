/// <reference path="../src/types/bcryptjs.d.ts" />
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

async function main(): Promise<void> {
  const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  if (!email || !password || password.length < 16) {
    throw new Error("Set INITIAL_ADMIN_EMAIL and a unique INITIAL_ADMIN_PASSWORD of at least 16 characters before seeding.");
  }
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, role: "ADMIN", status: "ACTIVE" },
    });
    console.log(`Initial admin account ensured for ${email}.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Admin bootstrap failed");
  process.exitCode = 1;
});
