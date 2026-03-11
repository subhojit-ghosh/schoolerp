import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
