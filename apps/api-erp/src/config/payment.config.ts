import { registerAs } from "@nestjs/config";

export const paymentConfig = registerAs("payment", () => ({
  credentialsKey: process.env.PAYMENT_CREDENTIALS_KEY ?? null,
}));
