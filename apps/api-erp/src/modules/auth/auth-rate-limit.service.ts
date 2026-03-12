import { HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import { authRateLimitEvent } from "@repo/database";
import { and, eq, gt, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { AUTH_PASSWORD_RESET, ERROR_MESSAGES } from "../../constants";

const RATE_LIMIT_KEYS = {
  IDENTIFIER: "identifier",
  IP: "ip",
  UNKNOWN_IP: "unknown",
} as const;

@Injectable()
export class AuthRateLimitService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async assertForgotPasswordAllowed(
    identifier: string,
    ipAddress?: string | null,
  ) {
    const createdAfter = new Date(
      Date.now() - AUTH_PASSWORD_RESET.RATE_LIMIT_WINDOW_MS,
    );
    const scopedKeys = this.buildForgotPasswordKeys(identifier, ipAddress);

    for (const key of scopedKeys) {
      const attempts = await this.countRecentAttempts(
        AUTH_PASSWORD_RESET.RATE_LIMIT_ACTION,
        key,
        createdAfter,
      );

      if (attempts >= AUTH_PASSWORD_RESET.RATE_LIMIT_MAX_ATTEMPTS) {
        throw new HttpException(
          ERROR_MESSAGES.AUTH.PASSWORD_RESET_REQUEST_BLOCKED,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  async recordForgotPasswordAttempt(
    identifier: string,
    ipAddress?: string | null,
  ) {
    const now = new Date();

    await this.db.insert(authRateLimitEvent).values(
      this.buildForgotPasswordKeys(identifier, ipAddress).map((key) => ({
        id: randomUUID(),
        action: AUTH_PASSWORD_RESET.RATE_LIMIT_ACTION,
        key,
        createdAt: now,
      })),
    );
  }

  private async countRecentAttempts(
    action: string,
    key: string,
    createdAfter: Date,
  ) {
    const [row] = await this.db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(authRateLimitEvent)
      .where(
        and(
          eq(authRateLimitEvent.action, action),
          eq(authRateLimitEvent.key, key),
          gt(authRateLimitEvent.createdAt, createdAfter),
        ),
      );

    return Number(row?.count ?? 0);
  }

  private buildForgotPasswordKeys(
    identifier: string,
    ipAddress?: string | null,
  ) {
    return [
      `${RATE_LIMIT_KEYS.IDENTIFIER}:${identifier}`,
      `${RATE_LIMIT_KEYS.IP}:${ipAddress ?? RATE_LIMIT_KEYS.UNKNOWN_IP}`,
    ];
  }
}
