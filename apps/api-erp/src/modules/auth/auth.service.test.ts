import { AUTH_CONTEXT_KEYS, AUTH_CONTEXT_LABELS } from "@repo/contracts";
import { describe, expect, mock, test } from "bun:test";
import { ConflictException } from "@nestjs/common";
import { ERROR_MESSAGES, MEMBER_TYPES, STATUS } from "../../constants";
import { AuthRateLimitService } from "./auth-rate-limit.service";
import { AuthService } from "./auth.service";
import { PasswordResetDeliveryService } from "./password-reset-delivery.service";

function setPrivateMethod(instance: object, name: string, value: unknown) {
  Reflect.set(instance, name, value);
}

function createAuthService() {
  const db = {
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => Promise.resolve(undefined)),
      })),
    })),
    select: mock(() => ({
      from: mock(() => ({
        where: mock(() => {
          const result = Promise.resolve([]);
          return Object.assign(result, {
            limit: mock(() => Promise.resolve([])),
          });
        }),
      })),
    })),
    transaction: mock(() => Promise.resolve(undefined)),
    delete: mock(() => ({
      where: mock(() => Promise.resolve(undefined)),
    })),
    insert: mock(() => ({
      values: mock(() => Promise.resolve(undefined)),
    })),
  };
  const rateLimitService = {
    assertForgotPasswordAllowed: mock(() => Promise.resolve(undefined)),
    recordForgotPasswordAttempt: mock(() => Promise.resolve(undefined)),
  } as unknown as AuthRateLimitService;
  const configService = {
    get: mock((key: string, fallback?: unknown) => fallback),
  };
  const deliveryService = {
    sendPasswordReset: mock(() => undefined),
  } as unknown as PasswordResetDeliveryService;

  return {
    db,
    service: new AuthService(
      db as never,
      configService as never,
      rateLimitService,
      deliveryService,
    ),
  };
}

describe("AuthService.resolveSessionAccessContext", () => {
  test("selects the requested tenant when the user has a matching membership", async () => {
    const { service } = createAuthService();

    setPrivateMethod(service, "listMemberships", () =>
      Promise.resolve([
        {
          id: "membership-1",
          organizationId: "org-1",
          organizationName: "Springfield High",
          organizationSlug: "springfield",
          memberType: MEMBER_TYPES.STAFF,
          status: STATUS.MEMBER.ACTIVE,
          primaryCampusId: "campus-1",
        },
      ]),
    );
    setPrivateMethod(service, "resolveDefaultCampusId", () =>
      Promise.resolve("campus-1"),
    );

    const result = await service.resolveSessionAccessContext(
      "user-1",
      "springfield",
    );

    expect(result).toEqual({
      activeOrganizationId: "org-1",
      activeContextKey: AUTH_CONTEXT_KEYS.STAFF,
      activeCampusId: "campus-1",
    });
  });

  test("fails closed when no tenant is selected for a multi-membership user", async () => {
    const { service } = createAuthService();

    setPrivateMethod(service, "listMemberships", () =>
      Promise.resolve([
        {
          id: "membership-1",
          organizationId: "org-1",
          organizationName: "Springfield High",
          organizationSlug: "springfield",
          memberType: MEMBER_TYPES.STAFF,
          status: STATUS.MEMBER.ACTIVE,
          primaryCampusId: "campus-1",
        },
        {
          id: "membership-2",
          organizationId: "org-2",
          organizationName: "Shelbyville High",
          organizationSlug: "shelbyville",
          memberType: MEMBER_TYPES.GUARDIAN,
          status: STATUS.MEMBER.ACTIVE,
          primaryCampusId: "campus-2",
        },
      ]),
    );

    const result = await service.resolveSessionAccessContext("user-1");

    expect(result).toEqual({
      activeOrganizationId: null,
      activeContextKey: null,
      activeCampusId: null,
    });
  });

  test("rejects tenant access when the user has no matching membership", async () => {
    const { service } = createAuthService();

    setPrivateMethod(service, "listMemberships", () =>
      Promise.resolve([
        {
          id: "membership-1",
          organizationId: "org-1",
          organizationName: "Springfield High",
          organizationSlug: "springfield",
          memberType: MEMBER_TYPES.STAFF,
          status: STATUS.MEMBER.ACTIVE,
          primaryCampusId: "campus-1",
        },
      ]),
    );

    try {
      await service.resolveSessionAccessContext("user-1", "shelbyville");
      throw new Error("Expected tenant membership check to throw");
    } catch (error) {
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED,
      );
    }
  });
});

describe("AuthService.setActiveCampus", () => {
  test("rejects switching to a campus outside the active tenant", async () => {
    const { service } = createAuthService();

    setPrivateMethod(service, "getSession", () =>
      Promise.resolve({
        token: "session-token",
        expiresAt: new Date(),
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: null,
        },
        activeOrganizationId: "org-1",
        activeContextKey: AUTH_CONTEXT_KEYS.STAFF,
        activeCampusId: "campus-1",
      }),
    );
    setPrivateMethod(service, "buildAuthContext", () =>
      Promise.resolve({
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: null,
        },
        expiresAt: new Date(),
        memberships: [],
        activeOrganization: null,
        availableContexts: [
          {
            key: AUTH_CONTEXT_KEYS.STAFF,
            label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.STAFF],
            membershipIds: ["membership-1"],
          },
        ],
        activeContext: {
          key: AUTH_CONTEXT_KEYS.STAFF,
          label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.STAFF],
          membershipIds: ["membership-1"],
        },
        activeCampus: null,
        campuses: [
          {
            id: "campus-1",
            organizationId: "org-1",
            name: "Main",
            slug: "main",
            code: null,
            isDefault: true,
            status: STATUS.CAMPUS.ACTIVE,
          },
        ],
        linkedStudents: [],
      }),
    );

    try {
      await service.setActiveCampus("session-token", "campus-2");
      throw new Error("Expected campus switch to throw");
    } catch (error) {
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED,
      );
    }
  });
});

describe("AuthService.setActiveContext", () => {
  test("switches to another available context in the same tenant session", async () => {
    const { service } = createAuthService();

    setPrivateMethod(service, "getSession", () =>
      Promise.resolve({
        token: "session-token",
        expiresAt: new Date(),
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: null,
        },
        activeOrganizationId: "org-1",
        activeContextKey: AUTH_CONTEXT_KEYS.STAFF,
        activeCampusId: "campus-1",
      }),
    );
    setPrivateMethod(service, "buildAuthContext", () =>
      Promise.resolve({
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: null,
        },
        expiresAt: new Date(),
        memberships: [],
        activeOrganization: null,
        availableContexts: [
          {
            key: AUTH_CONTEXT_KEYS.STAFF,
            label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.STAFF],
            membershipIds: ["membership-1"],
          },
          {
            key: AUTH_CONTEXT_KEYS.PARENT,
            label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.PARENT],
            membershipIds: ["membership-2"],
          },
        ],
        activeContext: {
          key: AUTH_CONTEXT_KEYS.STAFF,
          label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.STAFF],
          membershipIds: ["membership-1"],
        },
        activeCampus: null,
        campuses: [],
        linkedStudents: [],
      }),
    );
    setPrivateMethod(service, "getAuthContext", () =>
      Promise.resolve({
        user: {
          id: "user-1",
          name: "Admin",
          mobile: "9999999999",
          email: null,
        },
        expiresAt: new Date(),
        memberships: [],
        activeOrganization: null,
        availableContexts: [
          {
            key: AUTH_CONTEXT_KEYS.PARENT,
            label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.PARENT],
            membershipIds: ["membership-2"],
          },
        ],
        activeContext: {
          key: AUTH_CONTEXT_KEYS.PARENT,
          label: AUTH_CONTEXT_LABELS[AUTH_CONTEXT_KEYS.PARENT],
          membershipIds: ["membership-2"],
        },
        activeCampus: null,
        campuses: [],
        linkedStudents: [],
      }),
    );

    const result = await service.setActiveContext(
      "session-token",
      AUTH_CONTEXT_KEYS.PARENT,
    );

    expect(result.activeContext?.key).toBe(AUTH_CONTEXT_KEYS.PARENT);
  });
});

describe("AuthService.resetPassword", () => {
  test("returns a specific expired-token error", async () => {
    const { db, service } = createAuthService();

    db.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => {
          const rows = [
            {
              id: "reset-token-1",
              userId: "user-1",
              expiresAt: new Date(Date.now() - 60_000),
              consumedAt: null,
            },
          ];
          const result = Promise.resolve(rows);
          return Object.assign(result, {
            limit: mock(() => Promise.resolve(rows)),
          });
        }),
      })),
    }));

    try {
      await service.resetPassword("expired-token", "Password123!");
      throw new Error("Expected expired reset token to throw");
    } catch (error) {
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.AUTH.PASSWORD_RESET_TOKEN_EXPIRED,
      );
    }
  });
});

describe("AuthService.assertUserIdentityAvailable", () => {
  test("throws a conflict when the email already exists", async () => {
    const { db, service } = createAuthService();

    db.select = mock(() => ({
      from: mock(() => ({
        where: mock(() => {
          const rows = [{ mobile: "9999999999", email: "admin@example.com" }];
          const result = Promise.resolve(rows);
          return Object.assign(result, {
            limit: mock(() => Promise.resolve(rows)),
          });
        }),
      })),
    }));

    try {
      await service.assertUserIdentityAvailable(
        "8888888888",
        "admin@example.com",
      );
      throw new Error("Expected duplicate email conflict");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
    }
  });
});
