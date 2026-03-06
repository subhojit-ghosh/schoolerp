"use client";

import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";
import { ROUTES } from "@/constants";

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
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

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
