import { PrismaClient } from "./generated/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Safe field set for User relations in API responses — never include `password`.
export const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  role: true,
  createdAt: true,
} as const;
