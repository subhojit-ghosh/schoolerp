import { Logger } from "@nestjs/common";
import { DELIVERY_TIMEOUT_MS } from "../../../constants";
import type {
  DeliveryResult,
  EmailDeliveryMessage,
  EmailDeliveryProvider,
} from "../delivery.types";

export type SendGridCredentials = {
  apiKey: string;
};

export class SendGridEmailProvider implements EmailDeliveryProvider {
  private readonly logger = new Logger(SendGridEmailProvider.name);

  constructor(private readonly credentials: SendGridCredentials) {}

  async send(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    const { apiKey } = this.credentials;

    try {
      const content: Array<{ type: string; value: string }> = [
        { type: "text/plain", value: message.text },
      ];

      if (message.html) {
        content.push({ type: "text/html", value: message.html });
      }

      const response = await fetch(
        "https://api.sendgrid.com/v3/mail/send",
        {
          method: "POST",
          headers: {
            authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: message.to }] }],
            from: {
              email: message.fromAddress,
              name: message.fromName ?? undefined,
            },
            subject: message.subject,
            content,
          }),
          signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
        },
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        this.logger.error(
          `SendGrid API responded with ${response.status}: ${errorBody}`,
        );

        return { provider: "sendgrid", accepted: false, externalId: null };
      }

      const messageId = response.headers.get("x-message-id");

      return {
        provider: "sendgrid",
        accepted: true,
        externalId: messageId ?? null,
      };
    } catch (error) {
      this.logger.error(
        `SendGrid delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { provider: "sendgrid", accepted: false, externalId: null };
    }
  }
}
