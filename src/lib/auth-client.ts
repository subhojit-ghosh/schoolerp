"use client";

import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { ROUTES } from "@/constants";
import { env } from "@/env";

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),

    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = ROUTES.AUTH.TWO_FA;
      },
    }),
  ],
});

export const platformAuthClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BETTER_AUTH_URL,

  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = ROUTES.ADMIN.TWO_FA;
      },
    }),
  ],
});

// Named exports for convenience
export const { signIn, signOut, signUp, useSession } = authClient;
