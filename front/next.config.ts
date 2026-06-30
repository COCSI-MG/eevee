import type { NextConfig } from "next";

const schedulerApiInternalUrl = (
  process.env.SCHEDULER_API_INTERNAL_URL ?? "http://scheduler-api-service:3000"
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
        destination: `${schedulerApiInternalUrl}/:path*`,
      },
    ];
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
