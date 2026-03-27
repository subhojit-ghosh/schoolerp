import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DELIVERY_CHANNELS } from "@repo/contracts";
import {
  DELIVERY_PROVIDER_TOKENS,
  type DeliveryProviderType,
} from "../../constants";
import { DeliveryConfigService } from "./delivery-config.service";
import type {
  DeliveryResult,
  EmailDeliveryMessage,
  EmailDeliveryProvider,
  SmsDeliveryMessage,
  SmsDeliveryProvider,
} from "./delivery.types";

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly deliveryConfigService: DeliveryConfigService,
    @Inject(DELIVERY_PROVIDER_TOKENS.EMAIL)
    private readonly emailProvider: EmailDeliveryProvider,
    @Inject(DELIVERY_PROVIDER_TOKENS.SMS)
    private readonly smsProvider: SmsDeliveryProvider,
  ) {}

  async sendEmail(
    message: EmailDeliveryMessage,
    institutionId?: string,
  ): Promise<DeliveryResult> {
    const enrichedMessage: EmailDeliveryMessage = {
      ...message,
      fromAddress:
        message.fromAddress ??
        this.configService.get<string>(
          "delivery.emailFromAddress",
          "noreply@erp.test",
        ),
      fromName:
        message.fromName ??
        this.configService.get<string>(
          "delivery.emailFromName",
          "Education ERP",
        ),
    };

    // Try institution-specific provider first
    if (institutionId) {
      const institutionProvider =
        await this.resolveInstitutionEmailProvider(institutionId);

      if (institutionProvider) {
        this.logger.debug(
          `Using institution email provider for ${institutionId}`,
        );

        return institutionProvider.send(enrichedMessage);
      }
    }

    // Fall back to global provider
    return this.emailProvider.send(enrichedMessage);
  }

  async sendSms(
    message: SmsDeliveryMessage,
    institutionId?: string,
  ): Promise<DeliveryResult> {
    // Try institution-specific provider first
    if (institutionId) {
      const institutionProvider =
        await this.resolveInstitutionSmsProvider(institutionId);

      if (institutionProvider) {
        this.logger.debug(
          `Using institution SMS provider for ${institutionId}`,
        );

        return institutionProvider.send(message);
      }
    }

    // Fall back to global provider
    return this.smsProvider.send(message);
  }

  getConfiguredEmailProvider() {
    return this.configService.get<DeliveryProviderType>(
      "delivery.emailProvider",
    );
  }

  getConfiguredSmsProvider() {
    return this.configService.get<DeliveryProviderType>("delivery.smsProvider");
  }

  private async resolveInstitutionEmailProvider(
    institutionId: string,
  ): Promise<EmailDeliveryProvider | null> {
    const config =
      await this.deliveryConfigService.getActiveConfigWithCredentials(
        institutionId,
        DELIVERY_CHANNELS.EMAIL,
      );

    if (!config) {
      return null;
    }

    return this.deliveryConfigService.resolveInstitutionEmailProvider(
      config.provider,
      config.credentials,
    );
  }

  private async resolveInstitutionSmsProvider(
    institutionId: string,
  ): Promise<SmsDeliveryProvider | null> {
    const config =
      await this.deliveryConfigService.getActiveConfigWithCredentials(
        institutionId,
        DELIVERY_CHANNELS.SMS,
      );

    if (!config) {
      return null;
    }

    return this.deliveryConfigService.resolveInstitutionSmsProvider(
      config.provider,
      config.credentials,
    );
  }
}
