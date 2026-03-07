import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/org/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { TopBar } from "@/components/top-bar";

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
          <TopBar>
            {children}
          </TopBar>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
