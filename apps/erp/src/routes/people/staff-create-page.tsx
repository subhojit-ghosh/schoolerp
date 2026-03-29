import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
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
  type StaffCreateFormValues,
  EMPTY_STAFF_PROFILE,
  EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT,
  type StaffRoleAssignmentDraft,
} from "@/features/staff/model/staff-form-schema";
import { StaffCreateForm } from "@/features/staff/ui/staff-create-form";
import { StaffRoleAssignmentFields } from "@/features/staff/ui/staff-role-assignment-fields";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { buildStaffDetailRoute, ERP_ROUTES } from "@/constants/routes";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { UnsavedChangesDialog } from "@/components/feedback/unsaved-changes-dialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_VALUES: StaffCreateFormValues = {
  honorific: "",
  name: "",
  mobile: "",
  email: "",
  temporaryPassword: "",
  status: "active",
  profile: { ...EMPTY_STAFF_PROFILE },
};

const STAFF_CREATE_AUTO_SAVE_KEY = "staff-create";

export function StaffCreatePage() {
  useDocumentTitle("New Staff");
  const [isDirty, setIsDirty] = useState(false);
  const clearDraftRef = useRef<(() => void) | null>(null);
  const handleAutoSaveReady = useCallback((clearDraft: () => void) => {
    clearDraftRef.current = clearDraft;
  }, []);
  const blocker = useUnsavedChangesGuard(isDirty);
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStaff = isStaffContext(session);
  const managedInstitutionId = canManageStaff ? institutionId : undefined;
  const campuses = session?.activeCampus ? [session.activeCampus] : [];
  const activeCampusName = session?.activeCampus?.name;
  const createStaffMutation = useCreateStaffMutation(managedInstitutionId);
  const createAssignmentMutation =
    useCreateStaffRoleAssignmentMutation(managedInstitutionId);
  const staffRolesQuery = useStaffRolesQuery(managedInstitutionId);
  const createError = createStaffMutation.error as Error | null | undefined;
  const [roleAssignmentDraft, setRoleAssignmentDraft] =
    useState<StaffRoleAssignmentDraft>(EMPTY_STAFF_ROLE_ASSIGNMENT_DRAFT);
  const [roleAssignmentError, setRoleAssignmentError] = useState<string>();

  async function handleSubmit(values: StaffCreateFormValues) {
    if (!institutionId) {
      return;
    }

    setRoleAssignmentError(undefined);

    try {
      const createResult = await createStaffMutation.mutateAsync({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        body: values as any,
      });

      if (roleAssignmentDraft.roleId) {
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
          setRoleAssignmentError(
            error instanceof Error
              ? error.message
              : "The staff record was created, but the role assignment could not be saved.",
          );
        }
      }

      clearDraftRef.current?.();
      toast.success(
        ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.STAFF_RECORD),
      );
      void navigate(
        appendSearch(
          buildStaffDetailRoute(createResult.staff.id),
          location.search,
        ),
      );
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not create staff record. Please try again.",
        ),
      );
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
            Staff creation is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityPageShell width="compact">
      <EntityPageHeader
        backAction={
          <Breadcrumbs
            items={[
              {
                label: "Staff",
                href: appendSearch(ERP_ROUTES.STAFF, location.search),
              },
              { label: "New Staff" },
            ]}
          />
        }
        description={`Add a staff member for ${
          activeCampusName ?? "the selected campus"
        } and optionally assign an initial role.`}
        title="New Staff"
      />

      <Card className="w-full">
        <CardContent className="pt-6">
          <StaffCreateForm
            autoSaveKey={STAFF_CREATE_AUTO_SAVE_KEY}
            campusName={activeCampusName}
            defaultValues={DEFAULT_VALUES}
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
            onAutoSaveReady={handleAutoSaveReady}
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.STAFF, location.search));
            }}
            onDirtyChange={setIsDirty}
            onSubmit={handleSubmit}
            submitLabel="Create staff"
          />
        </CardContent>
      </Card>

      <UnsavedChangesDialog blocker={blocker} />
    </EntityPageShell>
  );
}
