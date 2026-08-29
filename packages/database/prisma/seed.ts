import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const passwordHash = await argon2.hash('Admin123!');

  // Find or create organization
  let organization = await prisma.organization.findFirst();
  if (!organization) {
    organization = await prisma.organization.create({
      data: {
        name: 'Ministry Hub HQ',
      },
    });
  }

  // Find or create church
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

  // Create or update Ralph Dev
  await prisma.user.upsert({
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

  // Create or update Admin User
  await prisma.user.upsert({
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

  console.log('Seeding complete! Users created: admin@ministryhub.com, ralph.dev@ministryhub.com (Password: Admin123!)');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
