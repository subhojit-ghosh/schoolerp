import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/org/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default async function OrgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
            {/* Breadcrumb goes here — populated per page */}
            <div className="ml-auto">
              <ModeToggle />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 p-4">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
