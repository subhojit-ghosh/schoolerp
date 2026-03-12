import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["erp.test", "*.erp.test"],
  transpilePackages: ["@repo/ui"],
};

export default nextConfig;
