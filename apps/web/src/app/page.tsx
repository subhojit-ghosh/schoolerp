import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { HEADERS, ROUTES } from "@/constants";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSignOutButton } from "@/components/platform/platform-sign-out-button";
import { hasAnySuperAdmin } from "@/server/auth/platform-super-admin";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default async function RootPage() {
  const institutionSlug = (await headers()).get(HEADERS.INSTITUTION_SLUG);

  if (institutionSlug) {
    redirect(ROUTES.DASHBOARD);
  }

  if (!(await hasAnySuperAdmin())) {
    redirect(ROUTES.ADMIN.SETUP);
  }

  const sessionUser = await getPlatformSessionUser();

  if (!sessionUser) {
    redirect(ROUTES.ADMIN.SIGN_IN);
  }

  if (!sessionUser.isSuperAdmin) {
    return (
      <div className="from-background via-muted/20 to-background min-h-svh bg-gradient-to-br">
        <header className="flex justify-end px-6 pt-6">
          <ModeToggle />
        </header>
        <main className="flex items-center justify-center px-6 py-12">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Platform access denied</CardTitle>
              <CardDescription>
                This account is signed in, but it does not have platform super
                admin privileges.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between gap-4">
              <p className="text-muted-foreground text-sm">
                Sign in with a platform super admin account to continue.
              </p>
              <PlatformSignOutButton />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  redirect(ROUTES.ADMIN.DASHBOARD);
}
