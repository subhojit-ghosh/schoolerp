import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["https://erp.test"],
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
