import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlatformSignOutButton } from "@/components/platform/platform-sign-out-button";
import { PlatformDashboard } from "@/components/platform/platform-dashboard";
import { hasAnySuperAdmin } from "@/server/auth/platform-super-admin";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";

export default async function RootPage() {
  const institutionSlug = (await headers()).get("x-institution-slug");

  if (institutionSlug) {
    const institution = await getCurrentInstitution();
    const org = await requireOrgAccess(institution);
    const visibleNavItems = filterNavItems(
      NAV_ITEMS,
      org.permissionSet,
      org.isSuperAdmin,
    );

    return (
      <OrgContextProvider value={org}>
        <SidebarProvider>
          <AppSidebar
            institutionName={institution.name}
            userName={org.user.name}
            userEmail={org.user.email}
            navItems={visibleNavItems}
          />
          <SidebarInset>
            <header className="flex h-16 items-center gap-2 border-b px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
            </header>
            <main className="flex flex-1 flex-col gap-4 p-4">
              <div>
                <h1 className="text-2xl font-bold">Welcome to {institution.name}</h1>
                <p className="text-muted-foreground mt-1">
                  Select a module from the sidebar to get started.
                </p>
              </div>
            </main>
          </SidebarInset>
        </SidebarProvider>
      </OrgContextProvider>
    );
  }

  if (!(await hasAnySuperAdmin())) {
    redirect("/setup");
  }

  const sessionUser = await getPlatformSessionUser();

  if (!sessionUser) {
    redirect("/sign-in");
  }

  if (!sessionUser.isSuperAdmin) {
    return (
      <main className="from-background via-muted/20 to-background flex min-h-svh items-center justify-center bg-gradient-to-br px-6 py-12">
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
    );
  }

  return <PlatformDashboard sessionUser={sessionUser} />;
}
