const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const email = 'university@acadshield.network';
  const password = 'UniversityPass123456';

  try {
    const passwordHash = await bcrypt.hash(password, 12);

    const institution = await prisma.institution.upsert({
      where: { code: 'ACADSHIELD-U1' },
      update: {
        name: 'AcadShield University',
        country: 'India',
        website: 'https://example.edu',
        status: 'ACTIVE',
      },
      create: {
        name: 'AcadShield University',
        code: 'ACADSHIELD-U1',
        country: 'India',
        website: 'https://example.edu',
        status: 'ACTIVE',
      },
    });

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: 'UNIVERSITY',
        status: 'ACTIVE',
        institutionId: institution.id,
      },
      create: {
        email,
        passwordHash,
        role: 'UNIVERSITY',
        status: 'ACTIVE',
        institutionId: institution.id,
      },
    });

    console.log(JSON.stringify({
      institutionId: institution.id,
      userId: user.id,
      email,
      password,
      role: user.role,
      status: user.status,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
