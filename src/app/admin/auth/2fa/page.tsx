import { PlatformTwoFactorForm } from "@/components/platform/platform-two-factor-form";
import { PlatformAuthShell } from "@/components/platform/platform-auth-shell";

export default function TwoFactorPage() {
  return (
    <PlatformAuthShell
      eyebrow="Verification"
      title="Platform verification"
      description="Enter the 6-digit code from your authenticator app to continue to the platform control plane."
    >
      <PlatformTwoFactorForm />
    </PlatformAuthShell>
  );
}
