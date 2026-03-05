import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/theme/mode-toggle";
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
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            {/* Breadcrumb slot — populated per page */}
          </div>
          <div className="ml-auto px-4">
            <ModeToggle />
          </div>
        </header>
        <main className="flex flex-1 flex-col p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
