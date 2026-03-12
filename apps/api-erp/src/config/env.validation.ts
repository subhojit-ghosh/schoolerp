import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  ERP_FRONTEND_URL: z.url().optional(),
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
