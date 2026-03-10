import { redirect } from "next/navigation";
import { PlatformSignInForm } from "@/components/platform/platform-sign-in-form";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { PlatformAuthShell } from "@/components/platform/platform-auth-shell";

export default async function SignInPage() {
  const sessionUser = await getPlatformSessionUser();
  if (sessionUser?.isSuperAdmin) {
    redirect("/");
  }

  return (
    <PlatformAuthShell
      eyebrow="Secure access"
      title="Platform sign in"
      description="Sign in as a platform super admin to manage institutions, approvals, and global settings."
    >
      <PlatformSignInForm />
    </PlatformAuthShell>
  );
}
