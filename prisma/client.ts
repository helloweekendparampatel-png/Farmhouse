import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';

const connectionString = process.env.DATABASE_URL;

function createPgPool(): Pool {
  const config: PoolConfig = { connectionString };
  if (connectionString) {
    const urlWantsTls = /\bsslmode=(require|verify-full|verify-ca)\b/i.test(connectionString);
    // Render sets RENDER=true; hosted Postgres needs TLS and node-pg often requires relaxed cert check.
    if (process.env.RENDER === 'true' || urlWantsTls) {
      config.ssl = { rejectUnauthorized: false };
    }
  }
  return new Pool(config);
}

const pool = createPgPool();
const adapter = new PrismaPg(pool);

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: ['error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
