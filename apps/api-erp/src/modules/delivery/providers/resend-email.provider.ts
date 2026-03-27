import { Logger } from "@nestjs/common";
import { DELIVERY_TIMEOUT_MS } from "../../../constants";
import type {
  DeliveryResult,
  EmailDeliveryMessage,
  EmailDeliveryProvider,
} from "../delivery.types";

export type ResendCredentials = {
  apiKey: string;
};

export class ResendEmailProvider implements EmailDeliveryProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly credentials: ResendCredentials) {}

  async send(message: EmailDeliveryMessage): Promise<DeliveryResult> {
    const { apiKey } = this.credentials;

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: message.fromName
            ? `${message.fromName} <${message.fromAddress}>`
            : message.fromAddress,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          html: message.html ?? undefined,
        }),
        signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "");
        this.logger.error(
          `Resend API responded with ${response.status}: ${errorBody}`,
        );

        return { provider: "resend", accepted: false, externalId: null };
      }

      const result = (await response.json()) as { id?: string };

      return {
        provider: "resend",
        accepted: true,
        externalId: result.id ?? null,
      };
    } catch (error) {
      this.logger.error(
        `Resend delivery failed: ${error instanceof Error ? error.message : String(error)}`,
      );

      return { provider: "resend", accepted: false, externalId: null };
    }
  }
}
