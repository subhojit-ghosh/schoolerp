import { describe, expect, mock, test } from "bun:test";
import { ConflictException } from "@nestjs/common";
import { OnboardingService } from "./onboarding.service";

function createOnboardingService() {
  const db = {
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(() => []),
        })),
      })),
    })),
    transaction: mock((callback: (tx: typeof db) => Promise<unknown>) =>
      callback({
        insert: mock(() => ({
          values: mock(() => undefined),
        })),
      } as unknown as typeof db),
    ),
  };
  const authService = {
    assertUserIdentityAvailable: mock(() => Promise.resolve(undefined)),
    createSession: mock(() =>
      Promise.resolve({
        token: "session-token",
        expiresAt: new Date("2026-03-12T00:00:00.000Z"),
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: "admin@example.com",
        },
        activeOrganizationId: "org-1",
        activeCampusId: "campus-1",
      }),
    ),
    getAuthContext: mock(() =>
      Promise.resolve({
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: "admin@example.com",
        },
        expiresAt: new Date("2026-03-12T00:00:00.000Z"),
        memberships: [],
        activeOrganization: null,
        activeCampus: null,
        campuses: [],
      }),
    ),
    requireSession: (value: unknown) => value,
  };

  return {
    db,
    service: new OnboardingService(db as never, authService as never),
  };
}

describe("OnboardingService", () => {
  test("rejects duplicate institution slugs", async () => {
    const { db, service } = createOnboardingService();

    db.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => ({
          limit: mock(() => [{ id: "org-1" }]),
        })),
      })),
    }));

    try {
      await service.createInstitution(
        {
          institutionName: "Springfield High",
          institutionSlug: "springfield",
          institutionShortName: "Springfield",
          campusName: "Main Campus",
          campusSlug: "main",
          adminName: "Admin",
          mobile: "9999999999",
          email: "admin@example.com",
          password: "Password123!",
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "bun-test",
        },
      );
      throw new Error("Expected duplicate institution slug to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
    }
  });

  test("creates an institution session with the new tenant context", async () => {
    const { service } = createOnboardingService();

    const result = await service.createInstitution(
      {
        institutionName: "Springfield High",
        institutionSlug: "springfield",
        institutionShortName: "Springfield",
        campusName: "Main Campus",
        campusSlug: "main",
        adminName: "Admin",
        mobile: "9999999999",
        email: "admin@example.com",
        password: "Password123!",
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "bun-test",
      },
    );

    expect(result.authSession.activeOrganizationId).toBe("org-1");
    expect(result.authSession.activeCampusId).toBe("campus-1");
  });
});
