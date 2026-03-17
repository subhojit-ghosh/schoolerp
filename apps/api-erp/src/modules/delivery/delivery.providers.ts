import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DELIVERY_PROVIDER_TYPES,
  DELIVERY_TIMEOUT_MS,
  type DeliveryProviderType,
} from "../../constants";
import type {
  DeliveryResult,
  EmailDeliveryMessage,
  EmailDeliveryProvider,
  SmsDeliveryMessage,
  SmsDeliveryProvider,
} from "./delivery.types";

@Injectable()
export class DisabledEmailDeliveryProvider implements EmailDeliveryProvider {
  private readonly logger = new Logger(DisabledEmailDeliveryProvider.name);

  async send(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    this.logger.warn(`Email delivery disabled for ${message.to}`);

    return {
      provider: DELIVERY_PROVIDER_TYPES.DISABLED,
      accepted: false,
      externalId: null,
    };
  }
}

@Injectable()
export class DisabledSmsDeliveryProvider implements SmsDeliveryProvider {
  private readonly logger = new Logger(DisabledSmsDeliveryProvider.name);

  async send(message: SmsDeliveryMessage): Promise<DeliveryResult> {
    this.logger.warn(`SMS delivery disabled for ${message.to}`);

    return {
      provider: DELIVERY_PROVIDER_TYPES.DISABLED,
      accepted: false,
      externalId: null,
    };
  }
}

@Injectable()
export class LogEmailDeliveryProvider implements EmailDeliveryProvider {
  private readonly logger = new Logger(LogEmailDeliveryProvider.name);

  async send(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    this.logger.log(
      `Email delivery queued for ${message.to} with subject "${message.subject}"`,
    );
    this.logger.debug(message.text);

    return {
      provider: DELIVERY_PROVIDER_TYPES.LOG,
      accepted: true,
      externalId: null,
    };
  }
}

@Injectable()
export class LogSmsDeliveryProvider implements SmsDeliveryProvider {
  private readonly logger = new Logger(LogSmsDeliveryProvider.name);

  async send(message: SmsDeliveryMessage): Promise<DeliveryResult> {
    this.logger.log(`SMS delivery queued for ${message.to}`);
    this.logger.debug(message.text);

    return {
      provider: DELIVERY_PROVIDER_TYPES.LOG,
      accepted: true,
      externalId: null,
    };
  }
}

@Injectable()
export class WebhookEmailDeliveryProvider implements EmailDeliveryProvider {
  constructor(private readonly configService: ConfigService) {}

  async send(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    return postWebhook(
      resolveWebhookUrl(
        this.configService,
        "delivery.emailWebhookUrl",
        DELIVERY_PROVIDER_TYPES.WEBHOOK,
      ),
      {
        channel: "email",
        message,
      },
    );
  }
}

@Injectable()
export class WebhookSmsDeliveryProvider implements SmsDeliveryProvider {
  constructor(private readonly configService: ConfigService) {}

  async send(message: SmsDeliveryMessage): Promise<DeliveryResult> {
    return postWebhook(
      resolveWebhookUrl(
        this.configService,
        "delivery.smsWebhookUrl",
        DELIVERY_PROVIDER_TYPES.WEBHOOK,
      ),
      {
        channel: "sms",
        message,
      },
    );
  }
}

function resolveWebhookUrl(
  configService: ConfigService,
  configKey: string,
  provider: DeliveryProviderType,
) {
  const webhookUrl = configService.get<string | null>(configKey, null);

  if (!webhookUrl) {
    throw new Error(
      `${provider} delivery provider requires ${configKey} to be configured`,
    );
  }

  return webhookUrl;
}

async function postWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>,
): Promise<DeliveryResult> {
  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(
      `Delivery webhook responded with ${response.status} ${response.statusText}`,
    );
  }

  return {
    provider: DELIVERY_PROVIDER_TYPES.WEBHOOK,
    accepted: true,
    externalId: response.headers.get("x-delivery-id"),
  };
}
