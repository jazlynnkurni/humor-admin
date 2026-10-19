import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* pages are rendered per request; the admin area is never cached */
  cacheComponents: false,
  /* config options here */
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
