const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash('Admin123!');

  let organization = await prisma.organization.findFirst();
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Ministry Hub HQ',
      },
    });
  }

  let church = await prisma.church.findFirst({
    where: { organizationId: organization.id },
  });
  if (!church) {
    church = await prisma.church.create({
      data: {
        organizationId: organization.id,
        name: 'First Ministry Church',
        address: '123 Ministry Way',
      },
    });
  }

  const ralph = await prisma.user.upsert({
    where: { email: 'ralph.dev@ministryhub.com' },
    update: {
      passwordHash,
      organizationId: organization.id,
      churchId: church.id,
      role: 'ADMIN',
    },
    create: {
      email: 'ralph.dev@ministryhub.com',
      passwordHash,
      firstName: 'Ralph',
      lastName: 'Dev',
      role: 'ADMIN',
      organizationId: organization.id,
      churchId: church.id,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ministryhub.com' },
    update: {
      passwordHash,
      organizationId: organization.id,
      churchId: church.id,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@ministryhub.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      organizationId: organization.id,
      churchId: church.id,
    },
  });

  console.log('Seeding successful!');
  console.log('Admin user ID:', admin.id, admin.email);
  console.log('Ralph user ID:', ralph.id, ralph.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('Seed error:', e);
    await prisma.$disconnect();
    process.exit(1);
  });