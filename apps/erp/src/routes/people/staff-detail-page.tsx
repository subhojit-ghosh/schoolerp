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
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStaffRoleAssignmentMutation,
  useDeleteStaffRoleAssignmentMutation,
  useStaffDetailQuery,
  useStaffRoleAssignmentsQuery,
  useStaffRolesQuery,
  useUpdateStaffMutation,
} from "@/features/staff/api/use-staff";
import { type StaffFormValues } from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { StaffRoleAssignmentsCard } from "@/features/staff/ui/staff-role-assignments-card";
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
  const campuses = session?.activeCampus ? [session.activeCampus] : [];
  const staffQuery = useStaffDetailQuery(managedInstitutionId, staffId);
  const assignmentsQuery = useStaffRoleAssignmentsQuery(
    managedInstitutionId,
    staffId,
  );
  const staffRolesQuery = useStaffRolesQuery(managedInstitutionId);
  const updateStaffMutation = useUpdateStaffMutation(managedInstitutionId);
  const createAssignmentMutation =
    useCreateStaffRoleAssignmentMutation(managedInstitutionId);
  const deleteAssignmentMutation =
    useDeleteStaffRoleAssignmentMutation(managedInstitutionId);
  const updateError = updateStaffMutation.error as Error | null | undefined;
  const createAssignmentError = createAssignmentMutation.error as
    | Error
    | null
    | undefined;
  const deleteAssignmentError = deleteAssignmentMutation.error as
    | Error
    | null
    | undefined;

  const defaultValues = useMemo<StaffFormValues>(() => {
    const staffRecord = staffQuery.data;

    if (!staffRecord) {
      return {
        name: "",
        mobile: "",
        email: "",
        status: "active",
      };
    }

    return {
      name: staffRecord.name,
      mobile: staffRecord.mobile,
      email: staffRecord.email ?? "",
      status: staffRecord.status as "active" | "inactive" | "suspended",
    };
  }, [staffQuery.data]);

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

  async function onCreateAssignment(values: {
    roleId: string;
    campusId?: string;
    classId?: string;
    sectionId?: string;
  }) {
    if (!institutionId || !staffId) {
      return;
    }

    await createAssignmentMutation.mutateAsync({
      params: {
        path: {
          staffId,
        },
      },
      body: values,
    });

    toast.success("Role assignment added.");
  }

  async function onDeleteAssignment(assignmentId: string) {
    if (!institutionId || !staffId) {
      return;
    }

    await deleteAssignmentMutation.mutateAsync({
      params: {
        path: {
          staffId,
          assignmentId,
        },
      },
    });

    toast.success("Role assignment removed.");
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
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        actions={
          <Button
            onClick={() =>
              void navigate(appendSearch(ERP_ROUTES.STAFF, location.search))
            }
            variant="outline"
          >
            Done
          </Button>
        }
        avatar={
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(staffRecord.name)}
          </div>
        }
        backAction={
          <Button asChild className="-ml-3" size="sm" variant="ghost">
            <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
              <IconChevronLeft data-icon="inline-start" />
              Back to staff
            </Link>
          </Button>
        }
        badges={
          <>
            <Badge
              variant={staffRecord.status === "active" ? "default" : "secondary"}
            >
              {staffRecord.status}
            </Badge>
            {staffRecord.role ? (
              <Badge variant="outline">{staffRecord.role.name}</Badge>
            ) : null}
          </>
        }
        meta={
          <>
            {staffRecord.mobile}
            {staffRecord.email ? ` • ${staffRecord.email}` : ""}
          </>
        }
        title={staffRecord.name}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit staff</CardTitle>
            <CardDescription>
              Update the staff identity details and membership status for the
              active campus.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StaffForm
              campusName={staffRecord.campusName}
              defaultValues={defaultValues}
              errorMessage={updateError?.message}
              isPending={updateStaffMutation.isPending}
              onSubmit={onSubmit}
              submitLabel="Save changes"
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
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
                <p className="mt-2 text-sm font-medium">
                  {staffRecord.memberType}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Primary campus
                </p>
                <p className="mt-2 text-sm font-medium">
                  {staffRecord.campusName}
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/80 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Latest assigned role
                </p>
                <p className="mt-2 text-sm font-medium">
                  {staffRecord.role?.name ?? "No role assigned"}
                </p>
              </div>
            </CardContent>
          </Card>

          <StaffRoleAssignmentsCard
            assignments={assignmentsQuery.data ?? []}
            assignmentsErrorMessage={
              assignmentsQuery.isError
                ? "Role assignments could not be loaded."
                : undefined
            }
            campuses={campuses}
            canManageAssignments={staffRolesQuery.isSuccess}
            createErrorMessage={createAssignmentError?.message}
            deleteErrorMessage={deleteAssignmentError?.message}
            isAssignmentsLoading={assignmentsQuery.isLoading}
            isCreating={createAssignmentMutation.isPending}
            isDeleting={deleteAssignmentMutation.isPending}
            onCreateAssignment={onCreateAssignment}
            onDeleteAssignment={onDeleteAssignment}
            roles={staffRolesQuery.data ?? []}
          />
        </div>
      </div>
    </EntityPageShell>
  );
}
