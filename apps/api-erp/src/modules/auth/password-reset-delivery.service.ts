import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import {
  AUTH_RECOVERY_CHANNELS,
  type AuthRecoveryChannel,
} from "../../constants";
import { DeliveryService } from "../delivery/delivery.service";

export type PasswordResetDeliveryRequest = {
  channel: AuthRecoveryChannel;
  recipient: string;
  token: string;
};

@Injectable()
export class PasswordResetDeliveryService {
  private readonly logger = new Logger(PasswordResetDeliveryService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly deliveryService: DeliveryService,
  ) {}

  async sendPasswordReset(request: PasswordResetDeliveryRequest) {
    this.logger.log(
      `Password reset requested via ${request.channel} for ${request.recipient}`,
    );

    const resetUrl = this.buildResetUrl(request.token);

    if (
      this.configService.get<boolean>("auth.passwordResetPreviewEnabled", false)
    ) {
      const destinationLabel =
        request.channel === AUTH_RECOVERY_CHANNELS.EMAIL ? "email" : "mobile";

      this.logger.debug(
        `Preview password reset for ${destinationLabel} ${request.recipient}: token=${request.token} url=${resetUrl}`,
      );
    }

    if (request.channel === AUTH_RECOVERY_CHANNELS.EMAIL) {
      await this.deliveryService.sendEmail({
        to: request.recipient,
        subject: "Reset your Education ERP password",
        text: [
          "A password reset was requested for your Education ERP account.",
          "",
          `Reset link: ${resetUrl}`,
          `Reset token: ${request.token}`,
          "",
          "If you did not request this, you can ignore this message.",
        ].join("\n"),
        metadata: {
          flow: "password-reset",
        },
      });

      return;
    }

    await this.deliveryService.sendSms({
      to: request.recipient,
      text: `Education ERP password reset. Token: ${request.token}. Reset link: ${resetUrl}`,
      metadata: {
        flow: "password-reset",
      },
    });
  }

  private buildResetUrl(token: string) {
    const resetUrlBase = this.configService.get<string>(
      "delivery.resetPasswordUrlBase",
      "https://erp.test",
    );
    const resetUrl = new URL("/reset-password", resetUrlBase);

    resetUrl.searchParams.set("token", token);

    return resetUrl.toString();
  }
}
