import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformTwoFactorForm } from "@/components/platform/platform-two-factor-form";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default function TwoFactorPage() {
  return (
    <div className="from-background via-muted/30 to-background min-h-svh bg-gradient-to-br">
      <header className="flex justify-end px-6 pt-6">
        <ModeToggle />
      </header>
      <main className="flex items-center justify-center px-6 py-12">
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
    </div>
  );
}
