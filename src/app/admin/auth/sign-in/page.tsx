import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSignInForm } from "@/components/platform/platform-sign-in-form";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default async function SignInPage() {
  const sessionUser = await getPlatformSessionUser();
  if (sessionUser?.isSuperAdmin) {
    redirect("/");
  }

  return (
    <div className="from-background via-muted/30 to-background min-h-svh bg-gradient-to-br">
      <header className="flex justify-end px-6 pt-6">
        <ModeToggle />
      </header>
      <main className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Platform sign in</CardTitle>
            <CardDescription>
              Sign in as a platform super admin to manage institutions and global
              settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PlatformSignInForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
