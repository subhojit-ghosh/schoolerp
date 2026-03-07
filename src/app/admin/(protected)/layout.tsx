import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ProfileDropdown } from "@/components/platform/admin-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TopBar } from "@/components/top-bar";

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
        <TopBar actions={<ProfileDropdown name={user.name} email={user.email} />}>
          {children}
        </TopBar>
      </SidebarInset>
    </SidebarProvider>
  );
}
