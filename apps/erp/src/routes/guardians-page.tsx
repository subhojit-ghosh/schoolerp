import { Link } from "react-router-dom";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useGuardiansQuery } from "@/features/guardians/api/use-guardians";
import { ERP_ROUTES } from "@/constants/routes";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function GuardiansPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageGuardians = isStaffContext(session);
  const managedInstitutionId = canManageGuardians ? institutionId : undefined;
  const guardiansQuery = useGuardiansQuery(managedInstitutionId);
  const guardians = guardiansQuery.data ?? [];

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing guardian records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageGuardians) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
          <CardDescription>
            Guardian management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Guardians</CardTitle>
          <CardDescription>
            Review guardian contact records and jump into student link management.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Guardian records</p>
            <p className="mt-2 text-2xl font-semibold">
              {guardiansQuery.isLoading ? "—" : guardians.length}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-sm text-muted-foreground">Linked students</p>
            <p className="mt-2 text-2xl font-semibold">
              {guardiansQuery.isLoading
                ? "—"
                : guardians.reduce(
                    (count, guardian) => count + guardian.linkedStudents.length,
                    0,
                  )}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
            Guardians are still created through the student workflow. This module
            handles listing, detail editing, and student link management.
          </div>
        </CardContent>
      </Card>

      {guardiansQuery.isLoading ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading guardians...
          </CardContent>
        </Card>
      ) : guardians.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No guardians yet</CardTitle>
            <CardDescription>
              Create a student with guardian details first, then manage the guardian from here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to={ERP_ROUTES.STUDENTS}>Go to students</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {guardians.map((guardian) => (
            <Card key={guardian.id}>
              <CardContent className="flex items-start justify-between gap-4 p-6">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-semibold">
                    {toInitials(guardian.name)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{guardian.name}</p>
                      <Badge variant="outline">{guardian.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {guardian.mobile}
                      {guardian.email ? ` • ${guardian.email}` : ""}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {guardian.campusName} • {guardian.linkedStudents.length} linked{" "}
                      {guardian.linkedStudents.length === 1 ? "student" : "students"}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={ERP_ROUTES.GUARDIAN_DETAIL.replace(":guardianId", guardian.id)}
                  >
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
