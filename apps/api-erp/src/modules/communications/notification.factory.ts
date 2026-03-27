import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import { notifications, type AppDatabase } from "@repo/database";
import { DeliveryService } from "../delivery/delivery.service";
import { randomUUID } from "node:crypto";

type NotificationChannelEnum = typeof notifications.$inferInsert.channel;
type NotificationTypeEnum = typeof notifications.$inferInsert.type;
type NotificationToneEnum = typeof notifications.$inferInsert.tone;
type NotificationAudienceEnum = typeof notifications.$inferInsert.audience;

export type NotifyInput = {
  institutionId: string;
  campusId?: string | null;
  createdByUserId: string;
  type: string;
  channel: string;
  tone: string;
  audience: string;
  title: string;
  message: string;
  senderLabel: string;
  actionLabel?: string;
  actionHref?: string;
  actionRequired?: boolean;
  outboundDelivery?: {
    sms?: { to: string; text: string };
    email?: { to: string; subject: string; text: string };
  };
};

@Injectable()
export class NotificationFactory {
  private readonly logger = new Logger(NotificationFactory.name);

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly deliveryService: DeliveryService,
  ) {}

  async notify(input: NotifyInput): Promise<string> {
    const notificationId = randomUUID();

    await this.db.insert(notifications).values({
      id: notificationId,
      institutionId: input.institutionId,
      campusId: input.campusId ?? null,
      createdByUserId: input.createdByUserId,
      type: input.type as NotificationTypeEnum,
      channel: input.channel as NotificationChannelEnum,
      tone: (input.tone as NotificationToneEnum) ?? "info",
      audience: (input.audience as NotificationAudienceEnum) ?? "all",
      title: input.title,
      message: input.message,
      senderLabel: input.senderLabel,
      actionLabel: input.actionLabel ?? null,
      actionHref: input.actionHref ?? null,
      actionRequired: input.actionRequired ?? false,
    });

    // Fire outbound delivery without blocking the caller
    if (input.outboundDelivery) {
      void this.sendOutbound(input.institutionId, input.outboundDelivery);
    }

    return notificationId;
  }

  private async sendOutbound(
    institutionId: string,
    delivery: NonNullable<NotifyInput["outboundDelivery"]>,
  ) {
    try {
      if (delivery.sms) {
        await this.deliveryService.sendSms(
          { to: delivery.sms.to, text: delivery.sms.text },
          institutionId,
        );
      }

      if (delivery.email) {
        await this.deliveryService.sendEmail(
          {
            to: delivery.email.to,
            subject: delivery.email.subject,
            text: delivery.email.text,
          },
          institutionId,
        );
      }
    } catch (error) {
      // Outbound delivery failure should not fail the notification insert
      this.logger.error(
        `Outbound delivery failed for institution ${institutionId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
