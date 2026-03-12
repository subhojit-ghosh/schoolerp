import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: ["erp.test", ".erp.test"],
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: ["erp.test", ".erp.test"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Resolve the workspace package source so Vite doesn't consume the CJS build artifact.
      "@academic-platform/contracts": path.resolve(
        __dirname,
        "../../packages/contracts/src/index.ts",
      ),
    },
  },
});
