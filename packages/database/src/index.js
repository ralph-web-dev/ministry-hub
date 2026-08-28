import { PrismaClient } from '@prisma/client';
const prismaClientSingleton = () => {
    return new PrismaClient();
};
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();
if (process.env.NODE_ENV !== 'production')
    globalForPrisma.prisma = prisma;
export * from '@prisma/client';
export { PrismaClient } from '@prisma/client';
//# sourceMappingURL=index.js.map