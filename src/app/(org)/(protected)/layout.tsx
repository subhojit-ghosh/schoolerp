import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess } from "@/server/auth/require-org-access";
import { OrgContextProvider } from "@/components/providers/org-context";
import { AppSidebar } from "@/components/org/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { NAV_ITEMS, filterNavItems } from "@/lib/nav";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Search } from "lucide-react";

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
          <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border/50 px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex flex-1 items-center gap-2">
              <div className="relative max-w-xs flex-1">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="h-8 w-full rounded-md border border-border/50 bg-muted/30 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-border focus:outline-none"
                  readOnly
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
                  ⌘K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">
            <div className="mx-auto max-w-6xl">
              {children}
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </OrgContextProvider>
  );
}
