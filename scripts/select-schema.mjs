// Picks which datasource prisma/schema.prisma should use before `prisma generate`/`db push` run.
// - On Vercel (VERCEL is always set during their builds), copy in the Postgres/Neon schema.
// - Everywhere else (local dev, a fresh `git clone`), leave the committed SQLite schema alone
//   so the app is self-contained and needs no external database.
import { copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const prismaDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "prisma");

if (process.env.VERCEL) {
  copyFileSync(
    path.join(prismaDir, "schema.production.prisma"),
    path.join(prismaDir, "schema.prisma"),
  );
  console.log("[select-schema] Vercel build detected — using Postgres schema.");
} else {
  console.log("[select-schema] Local build — using committed SQLite schema.");
}
