import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off for the hackathon build: every page here is dynamic
  // (listings, stats) and we don't want prerender/Suspense surprises.
  cacheComponents: false,
  // The browser needs the project URL for Google sign-in; it's public (the publishable key guards access).
  env: { NEXT_PUBLIC_SUPABASE_URL: process.env.SUPABASE_URL ?? "" },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
