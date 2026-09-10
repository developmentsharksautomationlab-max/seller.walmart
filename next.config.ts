import type { NextConfig } from "next";

const DASHBOARD_URL = "https://sellar-walmart.vercel.app/login";

const nextConfig: NextConfig = {
  // Pin the workspace root to this project. A stray package-lock.json in a
  // parent directory otherwise causes Next.js to infer the wrong root.
  turbopack: {
    root: __dirname,
  },

  // Opening the app (locally or on Vercel) redirects straight to the dashboard
  // login. Checked before the filesystem, so nothing here needs to render.
  async redirects() {
    return [
      {
        source: "/",
        destination: DASHBOARD_URL,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
