import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  ERP_FRONTEND_URL: z.url().optional(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
