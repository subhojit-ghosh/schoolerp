import Link from "next/link";
import { Building2, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { countInstitutionsByStatus } from "@/server/institutions/queries";

export default async function AdminDashboardPage() {
  const [user, counts] = await Promise.all([
    getPlatformSessionUser(),
    countInstitutionsByStatus(),
  ]);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-muted-foreground text-sm">Platform admin</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Welcome back, {user?.name ?? "Admin"}
          </h1>
        </div>
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION}>
          <Button size="sm">
            <Plus className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total institutions
            </CardTitle>
            <Building2 className="text-muted-foreground size-4" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.total}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle2 className="size-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.active}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Suspended</CardTitle>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{counts.suspended}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
