import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in a
  // parent directory otherwise causes Next.js to infer the wrong root.
  turbopack: {
    root: __dirname,
  },

  // `prisma db push` (in the build script) writes the schema into prisma/dev.db.
  // Bundle that file into every server function so the app can copy it to /tmp
  // at runtime — on Vercel /tmp is the only writable path. See src/lib/prisma.ts.
  outputFileTracingIncludes: {
    "/**": ["./prisma/dev.db"],
  },
};

export default nextConfig;
