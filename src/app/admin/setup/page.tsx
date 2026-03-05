import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialSuperAdminForm } from "@/components/platform/initial-super-admin-form";
import { hasAnySuperAdmin } from "@/server/auth/platform-super-admin";
import { ModeToggle } from "@/components/theme/mode-toggle";

export default async function SetupPage() {
  if (await hasAnySuperAdmin()) {
    redirect("/");
  }

  return (
    <div className="from-background via-muted/30 to-background min-h-svh bg-gradient-to-br">
      <header className="flex justify-end px-6 pt-6">
        <ModeToggle />
      </header>
      <main className="flex items-center justify-center px-6 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Initial platform setup</CardTitle>
            <CardDescription>
              Create the first platform super admin. This screen is only available
              until the platform has been initialized once.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InitialSuperAdminForm />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
