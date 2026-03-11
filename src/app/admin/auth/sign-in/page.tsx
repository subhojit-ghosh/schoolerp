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
      eyebrow="Platform super admin"
      title="Sign in to command the network."
      description="Access institution governance, provisioning, and oversight from one secure control plane."
    >
      <PlatformSignInForm />
    </PlatformAuthShell>
  );
}
