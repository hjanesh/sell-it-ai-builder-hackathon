import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cache Components is off for the hackathon build: every page here is dynamic
  // (listings, stats) and we don't want prerender/Suspense surprises.
  cacheComponents: false,
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
