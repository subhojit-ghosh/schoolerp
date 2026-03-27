import { defineConfig } from "drizzle-kit";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
});

export default defineConfig({
  schema: [
    "./src/schema/index.ts",
    "./src/schema/auth.ts",
    "./src/schema/delivery.ts",
    "./src/schema/payment.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  casing: "snake_case",
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
