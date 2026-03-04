import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { twoFactor } from "better-auth/plugins/two-factor";
import { db } from "@/db";
import * as authSchema from "@/db/schema/auth";

export const auth = betterAuth({
  secret: (() => {
    if (!process.env.BETTER_AUTH_SECRET) {
      throw new Error("BETTER_AUTH_SECRET environment variable is not set");
    }
    return process.env.BETTER_AUTH_SECRET;
  })(),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: authSchema,
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
        member: {
          additionalFields: {
            status: {
              type: "string",
              required: false,
              defaultValue: "active",
            },
            deletedAt: {
              type: "date",
              required: false,
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
