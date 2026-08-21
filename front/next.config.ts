import type { NextConfig } from "next";

const platformApiInternalUrl = (
  process.env.PLATFORM_API_INTERNAL_URL ?? "http://platform-api-service:3000"
).replace(/\/$/, "");

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    APP_ENV: process.env.APP_ENV,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${platformApiInternalUrl}/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
