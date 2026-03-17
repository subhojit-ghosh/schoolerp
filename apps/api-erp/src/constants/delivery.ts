export const DELIVERY_CHANNELS = {
  EMAIL: "email",
  SMS: "sms",
} as const;

export type DeliveryChannel =
  (typeof DELIVERY_CHANNELS)[keyof typeof DELIVERY_CHANNELS];

export const DELIVERY_PROVIDER_TYPES = {
  DISABLED: "disabled",
  LOG: "log",
  WEBHOOK: "webhook",
} as const;

export type DeliveryProviderType =
  (typeof DELIVERY_PROVIDER_TYPES)[keyof typeof DELIVERY_PROVIDER_TYPES];

export const DELIVERY_PROVIDER_TOKENS = {
  EMAIL: "EMAIL_DELIVERY_PROVIDER",
  SMS: "SMS_DELIVERY_PROVIDER",
} as const;

export const DELIVERY_TIMEOUT_MS = 10_000;
