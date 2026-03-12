import { Injectable, Logger } from "@nestjs/common";
import {
  AUTH_PASSWORD_RESET,
  AUTH_RECOVERY_CHANNELS,
  type AuthRecoveryChannel,
} from "../../constants";

export type PasswordResetDeliveryRequest = {
  channel: AuthRecoveryChannel;
  recipient: string;
  token: string;
};

@Injectable()
export class PasswordResetDeliveryService {
  private readonly logger = new Logger(PasswordResetDeliveryService.name);

  sendPasswordReset(request: PasswordResetDeliveryRequest) {
    this.logger.log(
      `Password reset requested via ${request.channel} for ${request.recipient}`,
    );

    if (AUTH_PASSWORD_RESET.PREVIEW_ENABLED) {
      const destinationLabel =
        request.channel === AUTH_RECOVERY_CHANNELS.EMAIL ? "email" : "mobile";

      this.logger.debug(
        `Preview reset token for ${destinationLabel} ${request.recipient}: ${request.token}`,
      );
    }
  }
}
