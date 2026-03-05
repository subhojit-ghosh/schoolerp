import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { ProfileDropdown } from "@/components/platform/admin-header";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

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
      <AdminSidebar adminName={user.name} adminEmail={user.email} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-3 border-b px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <SidebarTrigger variant="outline" className="-ml-1" />
          <Separator orientation="vertical" className="h-6" />
          {/* Search slot — future global search goes here */}
          <div className="ml-auto flex items-center gap-3">
            <ModeToggle />
            <ProfileDropdown name={user.name} email={user.email} />
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 px-4 py-6 sm:gap-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
