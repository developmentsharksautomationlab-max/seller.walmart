import { PrismaClient } from "@prisma/client";
import { copyFileSync, existsSync, renameSync } from "node:fs";
import path from "node:path";

// Resolve the SQLite database URL the Prisma client should use.
//
// - During `next build` nothing queries the database, so return a throwaway
//   local path — never touch the filesystem or a stale DATABASE_URL here.
// - On Vercel the deployment bundle is read-only and only /tmp is writable, so
//   run against /tmp/dev.db, seeded on cold start from prisma/dev.db — the
//   schema-only database that `prisma db push` baked into the bundle at build
//   time (bundled via outputFileTracingIncludes in next.config.ts). /tmp is
//   per-instance and cleared when the instance recycles, so data on Vercel is
//   not permanent — that's the trade for zero external database setup.
// - Everywhere else (local dev, self-hosted `next start`): use DATABASE_URL,
//   which defaults to prisma/dev.db via .env.
function resolveDatabaseUrl(): string {
  if (process.env.NEXT_PHASE === "phase-production-build") return "file:./dev.db";

  if (process.env.VERCEL) {
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

  return process.env.DATABASE_URL ?? "file:./dev.db";
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
