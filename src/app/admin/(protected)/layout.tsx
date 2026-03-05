import { redirect } from "next/navigation";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { AdminSidebar } from "@/components/platform/admin-sidebar";
import { ROUTES } from "@/constants";
import { ModeToggle } from "@/components/theme/mode-toggle";

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
    <div className="flex h-svh">
      <AdminSidebar adminName={user.name} />
      <main className="flex flex-1 flex-col overflow-y-auto">
        <header className="flex h-14 items-center justify-end border-b px-4">
          <ModeToggle />
        </header>
        <div className="flex-1">{children}</div>
      </main>
    </div>
  );
}
