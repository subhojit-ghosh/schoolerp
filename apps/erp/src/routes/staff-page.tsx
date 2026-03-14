import { useState } from "react";
import { Link } from "react-router";
import { IconArrowRight, IconBriefcase, IconBuildingEstate, IconPlus, IconUsersGroup } from "@tabler/icons-react";
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
import {
  useCreateStaffMutation,
  useStaffQuery,
  useStaffRolesQuery,
} from "@/features/staff/api/use-staff";
import {
  STAFF_UNASSIGNED_ROLE_VALUE,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { ERP_ROUTES } from "@/constants/routes";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

const DEFAULT_VALUES: StaffFormValues = {
  name: "",
  mobile: "",
  email: "",
  campusId: "",
  roleId: STAFF_UNASSIGNED_ROLE_VALUE,
  status: "active",
};

export function StaffPage() {
  const [showForm, setShowForm] = useState(false);
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const staffQuery = useStaffQuery(managedInstitutionId);
  const staffRolesQuery = useStaffRolesQuery(managedInstitutionId);
  const createStaffMutation = useCreateStaffMutation(managedInstitutionId);
  const createError = createStaffMutation.error as Error | null | undefined;

  async function onSubmit(values: StaffFormValues) {
    if (!institutionId) {
      return;
    }

    await createStaffMutation.mutateAsync({
      body: values,
    });

    setShowForm(false);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing staff records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStaff) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Staff management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const staffRecords = staffQuery.data ?? [];
  const staffCount = staffRecords.length;
  const assignedRoleCount = staffRecords.filter((record) => record.role).length;

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="relative overflow-hidden border-border/70 bg-card shadow-sm">
          <div
            className="absolute inset-0 opacity-100"
            style={{
              background:
                "radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 10%, transparent), transparent 38%), radial-gradient(circle at right center, color-mix(in srgb, var(--accent) 9%, transparent), transparent 28%)",
            }}
          />
          <CardContent className="relative flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="rounded-full px-3 py-1" variant="secondary">
                  <IconBriefcase className="mr-1.5 size-3.5" />
                  Membership-backed staff
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    Staff
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Manage the institution team with the existing membership model:
                    one human identity, one tenant-scoped staff membership, one
                    primary campus, and a simple role assignment when needed.
                  </p>
                </div>
              </div>
              <Button
                className="h-11 rounded-xl px-5 text-base shadow-sm"
                onClick={() => setShowForm((value) => !value)}
                variant={showForm ? "outline" : "default"}
              >
                <IconPlus className="size-4" />
                {showForm ? "Close form" : "Add staff"}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Team size
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {staffQuery.isLoading ? "—" : staffCount}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    active staff memberships
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Current campus
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <IconBuildingEstate className="size-4 text-[var(--primary)]" />
                  <span className="text-lg font-semibold tracking-tight">
                    {session?.activeCampus?.name ?? "No campus"}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Role assignment
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <IconUsersGroup className="size-4 text-[var(--primary)]" />
                  <span className="text-lg font-semibold tracking-tight">
                    {staffQuery.isLoading ? "—" : assignedRoleCount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Module limits</CardTitle>
            <CardDescription>
              This slice is intentionally narrow and stays out of HR-heavy workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 p-4">
              <p className="text-sm font-medium text-foreground">Included now</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Create, edit, campus assignment, and one optional institution role.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm font-medium text-foreground">Deferred</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Departments, leave, payroll, and richer permission management stay
                out of scope.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {showForm ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Create staff record</CardTitle>
            <CardDescription>
              Add a staff membership, assign a primary campus, and optionally attach
              an institution role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffForm
              campuses={campuses}
              defaultValues={{
                ...DEFAULT_VALUES,
                campusId: session?.activeCampus?.id ?? "",
              }}
              errorMessage={createError?.message}
              isPending={createStaffMutation.isPending}
              onCancel={() => setShowForm(false)}
              onSubmit={onSubmit}
              roles={staffRolesQuery.data ?? []}
              submitLabel="Create staff"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle>Team directory</CardTitle>
          <CardDescription>
            Staff memberships for the active institution, with campus and role context.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {staffQuery.isLoading ? (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Loading staff records...
            </div>
          ) : staffRecords.length ? (
            staffRecords.map((staffRecord) => (
              <div
                key={staffRecord.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/70 bg-background/85 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
                    {toInitials(staffRecord.name)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{staffRecord.name}</p>
                      <Badge variant={staffRecord.status === "active" ? "default" : "secondary"}>
                        {staffRecord.status}
                      </Badge>
                      {staffRecord.role ? (
                        <Badge variant="outline">{staffRecord.role.name}</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {staffRecord.mobile}
                      {staffRecord.email ? ` • ${staffRecord.email}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {staffRecord.campusName} • {staffRecord.memberType}
                    </p>
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    to={ERP_ROUTES.STAFF_DETAIL.replace(":staffId", staffRecord.id)}
                  >
                    Open record
                    <IconArrowRight data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/30 px-6 py-14 text-center">
              <p className="text-sm font-medium">No staff yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Add the first staff member to establish campus ownership and role assignment.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
