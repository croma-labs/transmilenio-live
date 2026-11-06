import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/api/schedule": ["./data/timetable/**"] },
  experimental: { serverActions: { bodySizeLimit: "1mb" } },
};

export default nextConfig;
