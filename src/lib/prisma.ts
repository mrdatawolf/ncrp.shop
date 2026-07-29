import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL ?? "";
const isLocalDb = /^postgresql:\/\/[^/]*(localhost|127\.0\.0\.1)/.test(databaseUrl);

const adapter = new PrismaPg({
  connectionString: databaseUrl,
  // PGlite (local dev) doesn't support the SSL handshake at all; real
  // Postgres providers (e.g. Neon) require it.
  ssl: isLocalDb ? false : undefined,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
