import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InitialSuperAdminForm } from "@/components/platform/initial-super-admin-form";
import { hasAnySuperAdmin } from "@/server/auth/platform-super-admin";

export default async function SetupPage() {
  if (await hasAnySuperAdmin()) {
    redirect("/");
  }

  return (
    <main className="from-background via-muted/30 to-background flex min-h-svh items-center justify-center bg-gradient-to-br px-6 py-12">
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
  );
}
