import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";
import { twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";

export const auth = betterAuth({
  secret: (() => {
    if (!process.env.BETTER_AUTH_SECRET) {
      throw new Error("BETTER_AUTH_SECRET environment variable is not set");
    }
    return process.env.BETTER_AUTH_SECRET;
  })(),
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled: true,
  },

  // Extend user with super_admin flag
  user: {
    additionalFields: {
      isSuperAdmin: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false, // cannot be set by user
      },
    },
  },

  plugins: [
    // Multi-tenancy: each institution = one organization
    organization({
      schema: {
        organization: {
          additionalFields: {
            institutionType: {
              type: "string",
              required: false,
            },
            status: {
              type: "string",
              required: false,
              defaultValue: "active",
            },
          },
        },
      },
      dynamicAccessControl: {
        enabled: true,
      },
    }),

    // 2FA — enforced per role in middleware, optional for others
    twoFactor(),
  ],
});
