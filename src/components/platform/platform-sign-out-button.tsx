"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { platformAuthClient } from "@/lib/auth-client";

export function PlatformSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await platformAuthClient.signOut();
    router.push("/sign-in");
  }

  return (
    <Button type="button" variant="outline" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
