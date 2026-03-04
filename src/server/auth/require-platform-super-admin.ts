import "server-only";

import { cache } from "react";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export type PlatformSessionUser = {
  id: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
};

export async function getPlatformSessionUser(): Promise<PlatformSessionUser | null> {
  return getPlatformSessionUserCached();
}

const getPlatformSessionUserCached = cache(
  async (): Promise<PlatformSessionUser | null> => {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      isSuperAdmin:
        (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true,
    };
  },
);
