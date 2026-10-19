import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Coolify/Cloudflare may forward an internal Host. Trust only the public app domain.
      allowedOrigins: ["rpp.griyaquran.web.id"],
    },
  },
};

export default nextConfig;
