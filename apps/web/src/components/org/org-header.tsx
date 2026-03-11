"use client";

import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { authClient } from "@/lib/auth-client";
import { UserMenu } from "@/components/app/user-menu";

type OrgProfileDropdownProps = {
  email: string;
  name: string;
};

export function OrgProfileDropdown({
  email,
  name,
}: OrgProfileDropdownProps) {
  const router = useRouter();

  async function handleSignOut() {
    await authClient.signOut();
    router.push(ROUTES.AUTH.SIGN_IN);
  }

  return (
    <UserMenu
      email={email}
      name={name}
      onSignOut={handleSignOut}
    />
  );
}
