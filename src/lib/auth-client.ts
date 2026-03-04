"use client";

import { createAuthClient } from "better-auth/client";
import { organizationClient } from "better-auth/client/plugins";
import { twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [
    organizationClient(),

    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/auth/2fa";
      },
    }),
  ],
});

export const platformAuthClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",

  plugins: [
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = "/2fa";
      },
    }),
  ],
});

// Named exports for convenience
export const { signIn, signOut, signUp, useSession } = authClient;
