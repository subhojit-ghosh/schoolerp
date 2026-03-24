import { z } from "zod";
import { DELIVERY_PROVIDER_TYPES } from "../constants";

const envSchema = z.object({
  DATABASE_URL: z.url(),
  APP_ROOT_HOST: z.string().min(1).optional(),
  APP_ROOT_DOMAIN: z.string().min(1).optional(),
  ERP_FRONTEND_URL: z.url().optional(),
  AUTH_COOKIE_DOMAIN: z.string().min(1).optional(),
  AUTH_COOKIE_SECURE: z.enum(["true", "false"]).optional(),
  AUTH_PASSWORD_RESET_PREVIEW: z.enum(["true", "false"]).optional(),
  AUTH_PASSWORD_RESET_URL_BASE: z.url().optional(),
  DELIVERY_EMAIL_PROVIDER: z
    .enum([
      DELIVERY_PROVIDER_TYPES.DISABLED,
      DELIVERY_PROVIDER_TYPES.LOG,
      DELIVERY_PROVIDER_TYPES.WEBHOOK,
    ])
    .optional(),
  DELIVERY_SMS_PROVIDER: z
    .enum([
      DELIVERY_PROVIDER_TYPES.DISABLED,
      DELIVERY_PROVIDER_TYPES.LOG,
      DELIVERY_PROVIDER_TYPES.WEBHOOK,
    ])
    .optional(),
  DELIVERY_EMAIL_WEBHOOK_URL: z.url().optional(),
  DELIVERY_SMS_WEBHOOK_URL: z.url().optional(),
  DELIVERY_EMAIL_FROM_ADDRESS: z.email().optional(),
  DELIVERY_EMAIL_FROM_NAME: z.string().min(1).optional(),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.url().optional(),
});

export function validateEnvironment(config: Record<string, unknown>) {
  return envSchema.parse(config);
}
