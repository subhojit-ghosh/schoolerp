import { describe, expect, mock, test } from "bun:test";
import { HttpException } from "@nestjs/common";
import { ERROR_MESSAGES } from "../../constants";
import { AuthRateLimitService } from "./auth-rate-limit.service";

describe("AuthRateLimitService", () => {
  test("blocks forgot-password requests after the configured threshold", async () => {
    const db = {
      select: mock(() => ({
        from: mock(() => ({
          where: mock(() => [{ count: 5 }]),
        })),
      })),
    };
    const service = new AuthRateLimitService(db as never);

    try {
      await service.assertForgotPasswordAllowed("9999999999", "127.0.0.1");
      throw new Error("Expected forgot-password rate limit to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_REQUEST_BLOCKED,
      );
    }
  });
});
