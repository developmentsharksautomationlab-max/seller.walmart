import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";

// Resolve the SQLite database URL.
//
// Local dev / self-hosting: use DATABASE_URL as-is (defaults to prisma/dev.db
// via .env) — a normal writable file.
//
// Vercel: the deployment bundle is read-only and only /tmp is writable, so we
// run against /tmp/dev.db. On a cold start it doesn't exist yet, so we seed it
// from prisma/dev.db — the schema-only database that `prisma db push` baked
// into the bundle during the build (bundled via outputFileTracingIncludes in
// next.config.ts). /tmp is per-instance and cleared when the instance recycles,
// so data on Vercel is not permanent — that's the trade for needing zero
// external database setup.
function resolveDatabaseUrl(): string {
  const configured = process.env.DATABASE_URL ?? "file:./dev.db";
  if (!process.env.VERCEL) return configured;

  const runtimeDb = "/tmp/dev.db";
  if (!existsSync(runtimeDb)) {
    const bakedDb = path.join(process.cwd(), "prisma", "dev.db");
    if (!existsSync(bakedDb)) {
      throw new Error(
        `Seed database not found at ${bakedDb}. The build should create it ` +
          `(\`prisma db push\`) and next.config.ts should bundle it via ` +
          `outputFileTracingIncludes.`,
      );
    }
    // Copy-then-rename so a concurrent cold start never reads a half-written file.
    const staging = `${runtimeDb}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
    copyFileSync(bakedDb, staging);
    try {
      renameSync(staging, runtimeDb);
    } catch {
      // Another invocation won the race and already put the file in place.
    }
  }
  return `file:${runtimeDb}`;
}

// Reuse a single PrismaClient across hot reloads in development to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: resolveDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
