import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
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
  useCreateStaffRoleAssignmentMutation,
  useCreateStaffMutation,
  useStaffRolesQuery,
} from "@/features/staff/api/use-staff";
import {
  type StaffFormValues,
  EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT,
  type StaffRoleAssignmentDraft,
} from "@/features/staff/model/staff-form-schema";
import { StaffForm } from "@/features/staff/ui/staff-form";
import { StaffRoleAssignmentFields } from "@/features/staff/ui/staff-role-assignment-fields";
import { buildStaffDetailRoute, ERP_ROUTES } from "@/constants/routes";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_VALUES: StaffFormValues = {
  name: "",
  mobile: "",
  email: "",
  campusId: "",
  status: "active",
};

export function StaffCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const createStaffMutation = useCreateStaffMutation(managedInstitutionId);
  const createAssignmentMutation =
    useCreateStaffRoleAssignmentMutation(managedInstitutionId);
  const staffRolesQuery = useStaffRolesQuery(managedInstitutionId);
  const createError = createStaffMutation.error as Error | null | undefined;
  const [roleAssignmentDraft, setRoleAssignmentDraft] =
    useState<StaffRoleAssignmentDraft>(EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT);
  const [roleAssignmentError, setRoleAssignmentError] = useState<string>();
  const [createdResult, setCreatedResult] = useState<{
    passwordSetup: {
      channel: string;
      recipient: string;
      resetTokenPreview?: string | null;
    } | null;
    roleAssignmentError?: string;
    roleAssignmentName?: string;
    staffId: string;
    staffName: string;
  } | null>(null);

  async function handleSubmit(values: StaffFormValues) {
    if (!institutionId) {
      return;
    }

    setRoleAssignmentError(undefined);

    const createResult = await createStaffMutation.mutateAsync({
      body: values,
    });

    let nextRoleAssignmentError: string | undefined;
    let roleAssignmentName: string | undefined;

    if (roleAssignmentDraft.roleId) {
      roleAssignmentName =
        staffRolesQuery.data?.find(
          (role) => role.id === roleAssignmentDraft.roleId,
        )?.name ?? undefined;

      try {
        await createAssignmentMutation.mutateAsync({
          params: {
            path: {
              staffId: createResult.staff.id,
            },
          },
          body: {
            roleId: roleAssignmentDraft.roleId,
            campusId: roleAssignmentDraft.campusId || undefined,
            classId: roleAssignmentDraft.classId || undefined,
            sectionId: roleAssignmentDraft.sectionId || undefined,
          },
        });
      } catch (error) {
        nextRoleAssignmentError =
          error instanceof Error
            ? error.message
            : "The staff record was created, but the role assignment could not be saved.";
        setRoleAssignmentError(nextRoleAssignmentError);
      }
    }

    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.STAFF_RECORD));
    setCreatedResult({
      passwordSetup: createResult.passwordSetup ?? null,
      roleAssignmentError: nextRoleAssignmentError,
      roleAssignmentName,
      staffId: createResult.staff.id,
      staffName: createResult.staff.name,
    });
    setRoleAssignmentDraft(EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT);
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
            Staff creation is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (createdResult) {
    return (
      <div className="flex flex-col gap-6">
        <div className="space-y-1">
          <Button asChild className="-ml-3" size="sm" variant="ghost">
            <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
              <IconChevronLeft data-icon="inline-start" />
              Back to staff
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold tracking-tight">
            Staff created
          </h1>
          <p className="text-sm text-muted-foreground">
            {createdResult.staffName} has been added to this institution.
          </p>
        </div>

        <Card className="max-w-4xl">
          <CardHeader>
            <CardTitle>Login setup</CardTitle>
            <CardDescription>
              New staff identities now start with password setup instead of an
              admin-entered password.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {createdResult.passwordSetup ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Password setup was started through{" "}
                  <span className="font-medium text-foreground">
                    {createdResult.passwordSetup.channel}
                  </span>{" "}
                  for{" "}
                  <span className="font-medium text-foreground">
                    {createdResult.passwordSetup.recipient}
                  </span>
                  .
                </p>

                {createdResult.passwordSetup.resetTokenPreview ? (
                  <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Dev preview token
                    </p>
                    <code className="block break-all rounded-md border bg-background px-3 py-2 text-xs">
                      {createdResult.passwordSetup.resetTokenPreview}
                    </code>
                    <Button asChild variant="outline">
                      <Link
                        to={`${ERP_ROUTES.RESET_PASSWORD}?token=${encodeURIComponent(createdResult.passwordSetup.resetTokenPreview)}`}
                      >
                        Open reset password page
                      </Link>
                    </Button>
                  </div>
                ) : null}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                This staff record was linked to an existing user identity, so no
                new password setup was started.
              </p>
            )}

            {createdResult.roleAssignmentName ? (
              <p className="text-sm text-muted-foreground">
                Initial role:{" "}
                <span className="font-medium text-foreground">
                  {createdResult.roleAssignmentName}
                </span>
              </p>
            ) : null}

            {createdResult.roleAssignmentError ? (
              <p className="text-sm text-destructive">
                Staff was created, but the initial role assignment failed:{" "}
                {createdResult.roleAssignmentError}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link
                  to={appendSearch(
                    buildStaffDetailRoute(createdResult.staffId),
                    location.search,
                  )}
                >
                  Open staff record
                </Link>
              </Button>
              <Button
                onClick={() => {
                  setCreatedResult(null);
                }}
                type="button"
                variant="outline"
              >
                Create another staff
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <Button asChild className="-ml-3" size="sm" variant="ghost">
          <Link to={appendSearch(ERP_ROUTES.STAFF, location.search)}>
            <IconChevronLeft data-icon="inline-start" />
            Back to staff
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create staff</h1>
        <p className="text-sm text-muted-foreground">
          Add a staff member, optionally assign the first role, and start their
          password setup flow.
        </p>
      </div>

      <Card className="max-w-4xl">
        <CardContent className="pt-6">
          <StaffForm
            campuses={campuses}
            defaultValues={{
              ...DEFAULT_VALUES,
              campusId: session?.activeCampus?.id ?? "",
            }}
            afterFields={
              staffRolesQuery.data && staffRolesQuery.data.length > 0 ? (
                <StaffRoleAssignmentFields
                  campuses={campuses}
                  disabled={
                    createStaffMutation.isPending ||
                    createAssignmentMutation.isPending
                  }
                  errorMessage={roleAssignmentError}
                  onChange={setRoleAssignmentDraft}
                  roles={staffRolesQuery.data}
                  value={roleAssignmentDraft}
                />
              ) : null
            }
            errorMessage={createError?.message}
            isPending={
              createStaffMutation.isPending ||
              createAssignmentMutation.isPending
            }
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.STAFF, location.search));
            }}
            onSubmit={handleSubmit}
            submitLabel="Create staff"
          />
        </CardContent>
      </Card>
    </div>
  );
}
