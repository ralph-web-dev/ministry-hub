import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  // Hash the password
  const passwordHash = await argon2.hash('Admin123!');

  // Create organization
  const organization = await prisma.organization.create({
    data: {
      name: 'Ministry Hub HQ',
    },
  });

  // Create church
  const church = await prisma.church.create({
    data: {
      organizationId: organization.id,
      name: 'First Ministry Church',
      address: '123 Ministry Way',
    },
  });

  // Create the main admin user
  const user = await prisma.user.upsert({
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

  console.log('Seeding complete! User created:', user.email);
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
