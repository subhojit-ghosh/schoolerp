"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { platformAuthClient } from "@/lib/auth-client";
import { ROUTES } from "@/constants";

export function PlatformSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await platformAuthClient.signOut();
    router.push(ROUTES.ADMIN.SIGN_IN);
  }

  return (
    <Button type="button" variant="outline" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
