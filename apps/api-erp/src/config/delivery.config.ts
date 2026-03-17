import { registerAs } from "@nestjs/config";
import { DELIVERY_PROVIDER_TYPES } from "../constants";

export const deliveryConfig = registerAs("delivery", () => ({
  emailProvider:
    process.env.DELIVERY_EMAIL_PROVIDER ?? DELIVERY_PROVIDER_TYPES.LOG,
  smsProvider: process.env.DELIVERY_SMS_PROVIDER ?? DELIVERY_PROVIDER_TYPES.LOG,
  emailWebhookUrl: process.env.DELIVERY_EMAIL_WEBHOOK_URL ?? null,
  smsWebhookUrl: process.env.DELIVERY_SMS_WEBHOOK_URL ?? null,
  emailFromAddress:
    process.env.DELIVERY_EMAIL_FROM_ADDRESS ?? "noreply@erp.test",
  emailFromName: process.env.DELIVERY_EMAIL_FROM_NAME ?? "Education ERP",
  resetPasswordUrlBase:
    process.env.AUTH_PASSWORD_RESET_URL_BASE ??
    process.env.ERP_FRONTEND_URL ??
    "https://erp.test",
}));
