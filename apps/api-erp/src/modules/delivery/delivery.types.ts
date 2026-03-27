import type { DeliveryProviderType } from "../../constants";
import type { DeliveryProvider } from "@repo/contracts";

export type EmailDeliveryMessage = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  fromAddress?: string;
  fromName?: string;
  metadata?: Record<string, string>;
};

export type SmsDeliveryMessage = {
  to: string;
  text: string;
  metadata?: Record<string, string>;
};

export type DeliveryResult = {
  provider: DeliveryProviderType | DeliveryProvider;
  accepted: boolean;
  externalId?: string | null;
};

export interface EmailDeliveryProvider {
  send(message: EmailDeliveryMessage): Promise<DeliveryResult>;
}

export interface SmsDeliveryProvider {
  send(message: SmsDeliveryMessage): Promise<DeliveryResult>;
}
