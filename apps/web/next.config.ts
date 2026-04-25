import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["erp.test", "*.erp.test"],
  transpilePackages: ["@repo/contracts", "@repo/ui"],
};

export default nextConfig;
