import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DELIVERY_PROVIDER_TOKENS,
  DELIVERY_PROVIDER_TYPES,
  type DeliveryProviderType,
} from "../../constants";
import {
  DisabledEmailDeliveryProvider,
  DisabledSmsDeliveryProvider,
  LogEmailDeliveryProvider,
  LogSmsDeliveryProvider,
  WebhookEmailDeliveryProvider,
  WebhookSmsDeliveryProvider,
} from "./delivery.providers";
import { DeliveryConfigService } from "./delivery-config.service";
import { DeliveryService } from "./delivery.service";
import type {
  EmailDeliveryProvider,
  SmsDeliveryProvider,
} from "./delivery.types";

@Module({
  providers: [
    DeliveryService,
    DeliveryConfigService,
    DisabledEmailDeliveryProvider,
    DisabledSmsDeliveryProvider,
    LogEmailDeliveryProvider,
    LogSmsDeliveryProvider,
    WebhookEmailDeliveryProvider,
    WebhookSmsDeliveryProvider,
    {
      provide: DELIVERY_PROVIDER_TOKENS.EMAIL,
      inject: [
        ConfigService,
        DisabledEmailDeliveryProvider,
        LogEmailDeliveryProvider,
        WebhookEmailDeliveryProvider,
      ],
      useFactory: (
        configService: ConfigService,
        disabledProvider: DisabledEmailDeliveryProvider,
        logProvider: LogEmailDeliveryProvider,
        webhookProvider: WebhookEmailDeliveryProvider,
      ) =>
        resolveProvider<EmailDeliveryProvider>(
          configService.get<DeliveryProviderType>(
            "delivery.emailProvider",
            DELIVERY_PROVIDER_TYPES.LOG,
          ),
          {
            [DELIVERY_PROVIDER_TYPES.DISABLED]: disabledProvider,
            [DELIVERY_PROVIDER_TYPES.LOG]: logProvider,
            [DELIVERY_PROVIDER_TYPES.WEBHOOK]: webhookProvider,
          },
          "email",
        ),
    },
    {
      provide: DELIVERY_PROVIDER_TOKENS.SMS,
      inject: [
        ConfigService,
        DisabledSmsDeliveryProvider,
        LogSmsDeliveryProvider,
        WebhookSmsDeliveryProvider,
      ],
      useFactory: (
        configService: ConfigService,
        disabledProvider: DisabledSmsDeliveryProvider,
        logProvider: LogSmsDeliveryProvider,
        webhookProvider: WebhookSmsDeliveryProvider,
      ) =>
        resolveProvider<SmsDeliveryProvider>(
          configService.get<DeliveryProviderType>(
            "delivery.smsProvider",
            DELIVERY_PROVIDER_TYPES.LOG,
          ),
          {
            [DELIVERY_PROVIDER_TYPES.DISABLED]: disabledProvider,
            [DELIVERY_PROVIDER_TYPES.LOG]: logProvider,
            [DELIVERY_PROVIDER_TYPES.WEBHOOK]: webhookProvider,
          },
          "sms",
        ),
    },
  ],
  exports: [DeliveryService, DeliveryConfigService],
})
export class DeliveryModule {}

function resolveProvider<T>(
  providerType: DeliveryProviderType,
  providers: Record<DeliveryProviderType, T>,
  channelLabel: string,
): T {
  const resolvedProvider = providers[providerType];

  if (!resolvedProvider) {
    throw new Error(
      `Unsupported ${channelLabel} delivery provider: ${providerType}`,
    );
  }

  return resolvedProvider;
}
