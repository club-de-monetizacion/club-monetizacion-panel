import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Raised from the 1MB default so a few attachment uploads (screenshots,
      // documents) on a task can go through in one request.
      bodySizeLimit: "15mb",
    },
  },
};

export default nextConfig;
