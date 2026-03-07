import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { ProfileDropdown } from "@/components/platform/admin-header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Search } from "lucide-react";

export default async function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getPlatformSessionUser();

  if (!user || !user.isSuperAdmin) {
    redirect(ROUTES.ADMIN.SIGN_IN);
  }

  return (
    <SidebarProvider>
      <AdminSidebar />
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
            <ProfileDropdown name={user.name} email={user.email} />
          </div>
        </header>
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
