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
          <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
            <SidebarTrigger variant="outline" className="-ml-1" />
            <Separator orientation="vertical" className="h-6" />
            {/* Search + breadcrumb slot */}
            <div className="ml-auto flex items-center gap-3">
              <ModeToggle />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:gap-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
