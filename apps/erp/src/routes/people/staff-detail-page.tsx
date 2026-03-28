import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  IconCertificate,
  IconHistory,
} from "@tabler/icons-react";
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
import { ConfirmDialog } from "@/components/feedback/confirm-dialog";
import {
  useCreateStaffRoleAssignmentMutation,
  useDeleteStaffRoleAssignmentMutation,
  useResetStaffPasswordMutation,
  useStaffDetailQuery,
  useStaffRoleAssignmentsQuery,
  useStaffRolesQuery,
  useStaffSubjectAssignmentsQuery,
  useCreateStaffSubjectAssignmentMutation,
  useDeleteStaffSubjectAssignmentMutation,
  useUpdateStaffMutation,
} from "@/features/staff/api/use-staff";
import {
  EMPTY_STAFF_PROFILE,
  type StaffFormValues,
} from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { StaffRoleAssignmentsCard } from "@/features/staff/ui/staff-role-assignments-card";
import { StaffSubjectAssignmentsCard } from "@/features/staff/ui/staff-subject-assignments-card";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ERP_ROUTES, buildStaffIdCardRoute } from "@/constants/routes";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { formatNameWithHonorific, formatPhone } from "@/lib/format";
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
  useDocumentTitle(staffQuery.data?.name ?? "Staff Details");
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
  const resetPasswordMutation =
    useResetStaffPasswordMutation(managedInstitutionId);
  const subjectAssignmentsQuery = useStaffSubjectAssignmentsQuery(
    managedInstitutionId,
    staffId,
  );
  const createSubjectMutation =
    useCreateStaffSubjectAssignmentMutation(managedInstitutionId);
  const deleteSubjectMutation =
    useDeleteStaffSubjectAssignmentMutation(managedInstitutionId);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
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
        honorific: "",
        name: "",
        mobile: "",
        email: "",
        status: "active" as const,
        profile: { ...EMPTY_STAFF_PROFILE },
      };
    }

    const profile = staffRecord.profile;

    return {
      honorific: ((staffRecord as { honorific?: string | null }).honorific ?? "") as StaffFormValues["honorific"],
      name: staffRecord.name,
      mobile: staffRecord.mobile,
      email: staffRecord.email ?? "",
      status: staffRecord.status as "active" | "inactive" | "suspended",
      profile: {
        employeeId: profile?.employeeId ?? "",
        designation: profile?.designation ?? "",
        department: profile?.department ?? "",
        dateOfJoining: profile?.dateOfJoining ?? "",
        dateOfBirth: profile?.dateOfBirth ?? "",
        gender: profile?.gender ?? "",
        bloodGroup: profile?.bloodGroup ?? "",
        address: profile?.address ?? "",
        emergencyContactName: profile?.emergencyContactName ?? "",
        emergencyContactMobile: profile?.emergencyContactMobile ?? "",
        qualification: profile?.qualification ?? "",
        experienceYears:
          profile?.experienceYears != null
            ? String(profile.experienceYears)
            : "",
        employmentType: profile?.employmentType ?? "",
      },
    };
  }, [staffQuery.data]);

  async function onSubmit(values: StaffFormValues) {
    if (!institutionId || !staffId) {
      return;
    }

    try {
      await updateStaffMutation.mutateAsync({
        params: {
          path: {
            staffId,
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: values as any,
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.STAFF_RECORD));
    } catch (error) {
      toast.error(extractApiError(error, "Could not update staff record. Please try again."));
    }
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

    try {
      await createAssignmentMutation.mutateAsync({
        params: {
          path: {
            staffId,
          },
        },
        body: values,
      });

      toast.success("Role assignment added.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not add role assignment. Please try again."));
    }
  }

  async function onDeleteAssignment(assignmentId: string) {
    if (!institutionId || !staffId) {
      return;
    }

    try {
      await deleteAssignmentMutation.mutateAsync({
        params: {
          path: {
            staffId,
            assignmentId,
          },
        },
      });

      toast.success("Role assignment removed.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not remove role assignment. Please try again."));
    }
  }

  async function handleResetPassword() {
    if (!institutionId || !staffId) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        params: {
          path: {
            staffId,
          },
        },
      });

      setResetPasswordOpen(false);
      toast.success("Password reset successfully.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not reset password. Please try again."));
    }
  }

  async function onCreateSubjectAssignment(values: {
    subjectId: string;
    classId?: string;
  }) {
    if (!institutionId || !staffId) {
      return;
    }

    try {
      await createSubjectMutation.mutateAsync({
        params: {
          path: {
            staffId,
          },
        },
        body: values,
      });

      toast.success("Subject assignment added.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not add subject assignment. Please try again."));
    }
  }

  async function onDeleteSubjectAssignment(assignmentId: string) {
    if (!institutionId || !staffId) {
      return;
    }

    try {
      await deleteSubjectMutation.mutateAsync({
        params: {
          path: {
            staffId,
            assignmentId,
          },
        },
      });

      toast.success("Subject assignment removed.");
    } catch (error) {
      toast.error(extractApiError(error, "Could not remove subject assignment. Please try again."));
    }
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
          <Breadcrumbs
            items={[
              { label: "Staff", href: appendSearch(ERP_ROUTES.STAFF, location.search) },
              { label: "Not found" },
            ]}
          />
        </CardContent>
      </Card>
    );
  }

  const staffRecord = staffQuery.data;
  const staffDisplayName = formatNameWithHonorific(
    staffRecord.name,
    (staffRecord as { honorific?: string | null }).honorific,
  );

  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        actions={
          <div className="flex gap-2">
            {staffId ? (
              <Button asChild variant="outline">
                <Link
                  to={buildStaffIdCardRoute(staffId)}
                  target="_blank"
                >
                  <IconCertificate className="size-4" />
                  ID Card
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" variant="ghost">
              <Link
                to={`${ERP_ROUTES.SETTINGS_AUDIT}?q=${encodeURIComponent(staffRecord.name)}`}
              >
                <IconHistory className="size-4" />
                View history
              </Link>
            </Button>
            <Button
              onClick={() => setResetPasswordOpen(true)}
              size="sm"
              variant="outline"
            >
              Reset password
            </Button>
            <Button
              onClick={() =>
                void navigate(appendSearch(ERP_ROUTES.STAFF, location.search))
              }
              variant="outline"
            >
              Done
            </Button>
          </div>
        }
        avatar={
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(staffRecord.name)}
          </div>
        }
        backAction={
          <Breadcrumbs
            items={[
              { label: "Staff", href: appendSearch(ERP_ROUTES.STAFF, location.search) },
              { label: staffDisplayName },
            ]}
          />
        }
        badges={
          <>
            <Badge
              variant={
                staffRecord.status === "active" ? "default" : "secondary"
              }
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
            {formatPhone(staffRecord.mobile)}
            {staffRecord.email ? ` • ${staffRecord.email}` : ""}
          </>
        }
        title={staffDisplayName}
      />

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

      <div className="grid gap-6 xl:grid-cols-2">
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

        <StaffSubjectAssignmentsCard
          assignments={
            (subjectAssignmentsQuery.data ?? []) as {
              id: string;
              subjectId: string;
              subjectName: string;
              classId: string | null;
              className: string | null;
              academicYearId: string | null;
              academicYearName: string | null;
              createdAt: string;
            }[]
          }
          isLoading={subjectAssignmentsQuery.isLoading}
          isCreating={createSubjectMutation.isPending}
          isDeleting={deleteSubjectMutation.isPending}
          createErrorMessage={
            (createSubjectMutation.error as Error | null)?.message
          }
          onCreateAssignment={onCreateSubjectAssignment}
          onDeleteAssignment={onDeleteSubjectAssignment}
          institutionId={managedInstitutionId}
        />
      </div>

      <ConfirmDialog
        confirmLabel="Reset password"
        description={`Reset this staff member's password to their mobile number? They will be required to change it on next login.`}
        isPending={resetPasswordMutation.isPending}
        onConfirm={() => {
          void handleResetPassword();
        }}
        onOpenChange={setResetPasswordOpen}
        open={resetPasswordOpen}
        title="Reset password"
      />
    </EntityPageShell>
  );
}
