import { Logger } from "@nestjs/common";
import { DELIVERY_TIMEOUT_MS } from "../../../constants";
import type {
  DeliveryResult,
  SmsDeliveryMessage,
  SmsDeliveryProvider,
} from "../delivery.types";

export type Msg91Credentials = {
  authKey: string;
  senderId: string;
  templateId: string;
};

export class Msg91SmsProvider implements SmsDeliveryProvider {
  private readonly logger = new Logger(Msg91SmsProvider.name);

  constructor(private readonly credentials: Msg91Credentials) {}

  async send(message: SmsDeliveryMessage): Promise<DeliveryResult> {
    const { authKey, senderId, templateId } = this.credentials;

    try {
      const response = await fetch("https://control.msg91.com/api/v5/flow/", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify({
          template_id: templateId,
          sender: senderId,
          short_url: "0",
          mobiles: message.to,
          VAR1: message.text,
        }),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });

      if (!response.ok) {
        const body = await response.text().catch(() => "");
        this.logger.error(
          `MSG91 API responded with ${response.status}: ${body}`,
        );

        return { provider: "msg91", accepted: false, externalId: null };
      }

      const result = (await response.json()) as {
        type?: string;
        request_id?: string;
      };

      return {
        provider: "msg91",
        accepted: result.type === "success",
        externalId: result.request_id ?? null,
      };
    } catch (error) {
      this.logger.error(
        `MSG91 delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { provider: "msg91", accepted: false, externalId: null };
    }
  }
}
