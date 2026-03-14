import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
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
  useStaffDetailQuery,
  useStaffRolesQuery,
  useUpdateStaffMutation,
} from "@/features/staff/api/use-staff";
import {
  STAFF_UNASSIGNED_ROLE_VALUE,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { ERP_ROUTES } from "@/constants/routes";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StaffDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { staffId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const staffQuery = useStaffDetailQuery(managedInstitutionId, staffId);
  const staffRolesQuery = useStaffRolesQuery(managedInstitutionId);
  const updateStaffMutation = useUpdateStaffMutation(managedInstitutionId);
  const updateError = updateStaffMutation.error as Error | null | undefined;

  const defaultValues = useMemo<StaffFormValues>(() => {
    const staffRecord = staffQuery.data;

    if (!staffRecord) {
      return {
        name: "",
        mobile: "",
        email: "",
        campusId: session?.activeCampus?.id ?? "",
        roleId: STAFF_UNASSIGNED_ROLE_VALUE,
        status: "active",
      };
    }

    return {
      name: staffRecord.name,
      mobile: staffRecord.mobile,
      email: staffRecord.email ?? "",
      campusId: staffRecord.campusId,
      roleId: staffRecord.role?.id ?? STAFF_UNASSIGNED_ROLE_VALUE,
      status: staffRecord.status,
    };
  }, [session?.activeCampus?.id, staffQuery.data]);

  async function onSubmit(values: StaffFormValues) {
    if (!institutionId || !staffId) {
      return;
    }

    await updateStaffMutation.mutateAsync({
      params: {
        path: {
          staffId,
        },
      },
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.STAFF_RECORD));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage staff records.
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
            Staff editing is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.DASHBOARD}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (staffQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading staff details...
        </CardContent>
      </Card>
    );
  }

  if (!staffQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff record not found</CardTitle>
          <CardDescription>
            The requested record could not be loaded for this institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
              <IconChevronLeft data-icon="inline-start" />
              Back to staff
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const staffRecord = staffQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(staffRecord.name)}
          </div>
          <div className="space-y-1">
            <Button asChild className="-ml-3" size="sm" variant="ghost">
              <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
                <IconChevronLeft data-icon="inline-start" />
                Back to staff
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{staffRecord.name}</h2>
              <Badge variant={staffRecord.status === "active" ? "default" : "secondary"}>
                {staffRecord.status}
              </Badge>
              {staffRecord.role ? <Badge variant="outline">{staffRecord.role.name}</Badge> : null}
            </div>
            <p className="text-sm text-muted-foreground">
              {staffRecord.mobile}
              {staffRecord.email ? ` • ${staffRecord.email}` : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={() => void navigate(appendSearch(ERP_ROUTES.STAFF, location.search))}
          variant="outline"
        >
          Done
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit staff</CardTitle>
            <CardDescription>
              Update the staff identity details, campus assignment, and current role.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffForm
              campuses={campuses}
              defaultValues={defaultValues}
              errorMessage={updateError?.message}
              isPending={updateStaffMutation.isPending}
              onSubmit={onSubmit}
              roles={staffRolesQuery.data ?? []}
              submitLabel="Save changes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Membership summary</CardTitle>
            <CardDescription>
              Current tenant-scoped membership state for this staff record.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Member type
              </p>
              <p className="mt-2 text-sm font-medium">{staffRecord.memberType}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Primary campus
              </p>
              <p className="mt-2 text-sm font-medium">{staffRecord.campusName}</p>
            </div>
            <div className="rounded-xl border border-border/70 bg-background/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                Assigned role
              </p>
              <p className="mt-2 text-sm font-medium">
                {staffRecord.role?.name ?? "No role assigned"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
