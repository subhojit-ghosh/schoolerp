import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSignOutButton } from "@/components/platform/platform-sign-out-button";
import type { PlatformSessionUser } from "@/server/auth/require-platform-super-admin";

type PlatformDashboardProps = {
  sessionUser: PlatformSessionUser;
};

export function PlatformDashboard({ sessionUser }: PlatformDashboardProps) {
  return (
    <main className="from-background via-muted/20 to-background min-h-svh bg-gradient-to-br px-6 py-12">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-muted-foreground text-sm uppercase tracking-[0.2em]">
              Platform control plane
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Welcome, {sessionUser.name}
            </h1>
            <p className="text-muted-foreground mt-3 max-w-2xl text-base leading-7">
              You are signed in on the main domain as a platform super admin.
              This is the correct boundary for institution provisioning and
              global administration.
            </p>
          </div>
          <PlatformSignOutButton />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Institution management</CardTitle>
              <CardDescription>
                Create institutions, assign subdomains, and onboard tenant
                administrators from here.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-6">
                The platform shell is now active on the root domain. Tenant
                dashboards remain isolated under their institution subdomains.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Next step</CardTitle>
              <CardDescription>
                Build out the actual platform modules in this section.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm leading-6">
                The auth boundary is now correct. What remains is adding the
                platform-specific screens and actions.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
