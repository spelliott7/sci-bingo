import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Connects over a WebSocket (still port 443) instead of raw Postgres TCP
// (port 5432). Some hosts — including the one this app is deployed on —
// block outbound 5432 entirely but always allow 443, since that's needed
// for the site itself. (Neon's pure-HTTP adapter mode was tried first and
// is simpler, but its Prisma adapter doesn't correctly parse timestamp
// columns at this version — this WebSocket-based one does.)
neonConfig.webSocketConstructor = ws;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set.");
  }
  const pool = new Pool({ connectionString });
  const adapter = new PrismaNeon(pool);
  return new PrismaClient({ adapter });
}

// Avoid exhausting the DB connection pool from hot-reloaded modules in dev.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
