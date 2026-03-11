"use client";

import { useRouter } from "next/navigation";
import { platformAuthClient } from "@/lib/auth-client";
import { ROUTES } from "@/constants";
import { UserMenu } from "@/components/app/user-menu";

type ProfileDropdownProps = {
  name: string;
  email: string;
};

export function ProfileDropdown({ name, email }: ProfileDropdownProps) {
  const router = useRouter();

  async function handleSignOut() {
    await platformAuthClient.signOut();
    router.push(ROUTES.ADMIN.SIGN_IN);
  }

  return (
    <UserMenu
      email={email}
      name={name}
      onSignOut={handleSignOut}
    />
  );
}
