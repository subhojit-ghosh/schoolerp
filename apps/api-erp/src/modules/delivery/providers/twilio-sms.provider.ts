import { Logger } from "@nestjs/common";
import { DELIVERY_TIMEOUT_MS } from "../../../constants";
import type {
  DeliveryResult,
  SmsDeliveryMessage,
  SmsDeliveryProvider,
} from "../delivery.types";

export type TwilioCredentials = {
  accountSid: string;
  authToken: string;
  fromNumber: string;
};

export class TwilioSmsProvider implements SmsDeliveryProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);

  constructor(private readonly credentials: TwilioCredentials) {}

  async send(message: SmsDeliveryMessage): Promise<DeliveryResult> {
    const { accountSid, authToken, fromNumber } = this.credentials;

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
      const auth = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

      const body = new URLSearchParams({
        To: message.to,
        From: fromNumber,
        Body: message.text,
      });

      const response = await fetch(url, {
        method: "POST",
        headers: {
          authorization: `Basic ${auth}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        this.logger.error(
          `Twilio API responded with ${response.status}: ${errorBody}`,
        );

        return { provider: "twilio", accepted: false, externalId: null };
      }

      const result = (await response.json()) as {
        sid?: string;
        status?: string;
      };

      return {
        provider: "twilio",
        accepted: true,
        externalId: result.sid ?? null,
      };
    } catch (error) {
      this.logger.error(
        `Twilio delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { provider: "twilio", accepted: false, externalId: null };
    }
  }
}
