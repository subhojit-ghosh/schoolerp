import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  DELIVERY_PROVIDER_TOKENS,
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
export class DeliveryService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(DELIVERY_PROVIDER_TOKENS.EMAIL)
    private readonly emailProvider: EmailDeliveryProvider,
    @Inject(DELIVERY_PROVIDER_TOKENS.SMS)
    private readonly smsProvider: SmsDeliveryProvider,
  ) {}

  sendEmail(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    return this.emailProvider.send({
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
    });
  }

  sendSms(message: SmsDeliveryMessage): Promise<DeliveryResult> {
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
}
