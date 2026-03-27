import { z } from "zod";
import { DELIVERY_PROVIDERS, DELIVERY_CHANNELS } from "@repo/contracts";

const smsProviders = [DELIVERY_PROVIDERS.MSG91, DELIVERY_PROVIDERS.TWILIO] as const;
const emailProviders = [DELIVERY_PROVIDERS.RESEND, DELIVERY_PROVIDERS.SENDGRID] as const;
const allProviders = [...smsProviders, ...emailProviders, DELIVERY_PROVIDERS.DISABLED] as const;

const channelSchema = z.enum([DELIVERY_CHANNELS.SMS, DELIVERY_CHANNELS.EMAIL]);

const upsertDeliveryConfigSchema = z.object({
  provider: z.enum(allProviders as unknown as [string, ...string[]]),
  credentials: z.record(z.string(), z.string().min(1)),
  senderIdentity: z.string().optional(),
});

const testDeliverySchema = z.object({
  channel: channelSchema,
  recipient: z.string().min(1),
});

export type UpsertDeliveryConfig = z.infer<typeof upsertDeliveryConfigSchema>;
export type TestDeliveryInput = z.infer<typeof testDeliverySchema>;

export function parseUpsertDeliveryConfig(raw: unknown): UpsertDeliveryConfig {
  return upsertDeliveryConfigSchema.parse(raw);
}

export function parseTestDelivery(raw: unknown): TestDeliveryInput {
  return testDeliverySchema.parse(raw);
}

export function parseDeliveryChannel(raw: unknown): "sms" | "email" {
  return channelSchema.parse(raw);
}
