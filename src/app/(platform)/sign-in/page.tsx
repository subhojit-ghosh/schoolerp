import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSignInForm } from "@/components/platform/platform-sign-in-form";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";

export default async function SignInPage() {
  const sessionUser = await getPlatformSessionUser();
  if (sessionUser?.isSuperAdmin) {
    redirect("/");
  }

  return (
    <main className="from-background via-muted/30 to-background flex min-h-svh items-center justify-center bg-gradient-to-br px-6 py-12">
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
  );
}
