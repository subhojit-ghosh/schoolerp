import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformTwoFactorForm } from "@/components/platform/platform-two-factor-form";

export default function TwoFactorPage() {
  return (
    <main className="from-background via-muted/30 to-background flex min-h-svh items-center justify-center bg-gradient-to-br px-6 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Platform verification</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to continue to
            the platform control plane.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PlatformTwoFactorForm />
        </CardContent>
      </Card>
    </main>
  );
}
