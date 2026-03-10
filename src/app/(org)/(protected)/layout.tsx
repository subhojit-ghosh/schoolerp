import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/org/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { TopBar } from "@/components/top-bar";
import { OrgProfileDropdown } from "@/components/org/org-header";

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
          <TopBar
            actions={<OrgProfileDropdown email={org.user.email} name={org.user.name} />}
            searchPlaceholder="Search students, classes, invoices"
            status={(
              <div className="hidden items-center rounded-xl border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-emerald-800 lg:flex">
                Active academic year
              </div>
            )}
          >
            {children}
          </TopBar>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
