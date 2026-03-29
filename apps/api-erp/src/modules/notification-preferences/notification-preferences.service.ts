import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  eq,
  notificationPreferences,
  type AppDatabase,
} from "@repo/database";
import { randomUUID } from "node:crypto";

type NotificationPrefsDto = {
  channelSms?: boolean;
  channelEmail?: boolean;
  channelInApp?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
  digestMode?: "instant" | "daily" | "weekly";
};

@Injectable()
export class NotificationPreferencesService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async getPreferences(userId: string, institutionId: string) {
    const row = await this.db
      .select()
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (!row) {
      return {
        channelSms: true,
        channelEmail: true,
        channelInApp: true,
        quietHoursStart: null,
        quietHoursEnd: null,
        digestMode: "instant",
      };
    }

    return {
      channelSms: row.channelSms,
      channelEmail: row.channelEmail,
      channelInApp: row.channelInApp,
      quietHoursStart: row.quietHoursStart,
      quietHoursEnd: row.quietHoursEnd,
      digestMode: row.digestMode,
    };
  }

  async updatePreferences(
    userId: string,
    institutionId: string,
    dto: NotificationPrefsDto,
  ) {
    const existing = await this.db
      .select({ id: notificationPreferences.id })
      .from(notificationPreferences)
      .where(
        and(
          eq(notificationPreferences.userId, userId),
          eq(notificationPreferences.institutionId, institutionId),
        ),
      )
      .then((rows) => rows[0]);

    if (existing) {
      await this.db
        .update(notificationPreferences)
        .set({
          channelSms: dto.channelSms,
          channelEmail: dto.channelEmail,
          channelInApp: dto.channelInApp,
          quietHoursStart: dto.quietHoursStart,
          quietHoursEnd: dto.quietHoursEnd,
          digestMode: dto.digestMode,
        })
        .where(eq(notificationPreferences.id, existing.id));

      return { id: existing.id };
    }

    const id = randomUUID();
    await this.db.insert(notificationPreferences).values({
      id,
      userId,
      institutionId,
      channelSms: dto.channelSms ?? true,
      channelEmail: dto.channelEmail ?? true,
      channelInApp: dto.channelInApp ?? true,
      quietHoursStart: dto.quietHoursStart ?? null,
      quietHoursEnd: dto.quietHoursEnd ?? null,
      digestMode: dto.digestMode ?? "instant",
    });

    return { id };
  }
}
