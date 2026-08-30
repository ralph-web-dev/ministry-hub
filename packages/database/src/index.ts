import { PrismaClient } from './generated/client/index.js';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from './generated/client/index.js';
export {
  PrismaClient,
  Prisma,
  Role,
  MembershipStatus,
  BaptismStatus,
  Gender,
  AttendanceStatus,
  AttendanceType,
} from './generated/client/index.js';
export type {
  Organization,
  Church,
  User,
  Member,
  AttendanceRecord,
  AuditLog,
} from './generated/client/index.js';



