import { useParams, useLocation, useNavigate } from "react-router";
import { PERMISSIONS } from "@repo/contracts";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useCreateRoleMutation,
  usePermissionsQuery,
  useRoleQuery,
  useUpdateRoleMutation,
} from "@/features/roles/api/use-roles";
import type { RoleFormValues } from "@/features/roles/model/role-form-schema";
import { RoleForm } from "@/features/roles/ui/role-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type RoleSheetRouteProps = {
  mode: "create" | "edit" | "view";
};

const DEFAULT_ROLE_FORM_VALUES: RoleFormValues = {
  name: "",
  permissionIds: [],
};

function CreateRoleSheet() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const enabled =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.INSTITUTION_ROLES_MANAGE);

  const createMutation = useCreateRoleMutation();
  const permissionsQuery = usePermissionsQuery(enabled);

  async function handleSubmit(values: RoleFormValues) {
    try {
      await createMutation.mutateAsync({ body: values });
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.ROLE));
      void navigate(appendSearch(ERP_ROUTES.SETTINGS_ROLES, location.search));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not create role. Please try again."),
      );
    }
  }

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.SETTINGS_ROLES}
      description="Name the role and choose permissions."
      title="New role"
    >
      <RoleForm
        defaultValues={DEFAULT_ROLE_FORM_VALUES}
        errorMessage={
          (createMutation.error as Error | null | undefined)?.message ??
          undefined
        }
        isPending={createMutation.isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.SETTINGS_ROLES, location.search),
          );
        }}
        onSubmit={handleSubmit}
        permissions={permissionsQuery.data}
        permissionsLoading={permissionsQuery.isLoading}
        submitLabel="Create role"
      />
    </RouteEntitySheet>
  );
}

function EditRoleSheet() {
  const { roleId } = useParams<{ roleId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const enabled =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.INSTITUTION_ROLES_MANAGE);

  const roleQuery = useRoleQuery(enabled, roleId);
  const permissionsQuery = usePermissionsQuery(enabled);
  const updateMutation = useUpdateRoleMutation(roleId ?? "");

  const role = roleQuery.data;
  const isSystem = role?.isSystem ?? false;

  const defaultValues: RoleFormValues = role
    ? {
        name: role.name,
        permissionIds: role.permissions.map((p) => p.id),
      }
    : DEFAULT_ROLE_FORM_VALUES;

  async function handleSubmit(values: RoleFormValues) {
    if (!roleId) return;
    try {
      await updateMutation.mutateAsync({
        params: { path: { roleId } },
        body: values,
      });
      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ROLE));
      void navigate(appendSearch(ERP_ROUTES.SETTINGS_ROLES, location.search));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not update role. Please try again."),
      );
    }
  }

  if (roleQuery.isLoading || permissionsQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.SETTINGS_ROLES}
        title={isSystem ? "View role" : "Edit role"}
      >
        <div className="space-y-4 p-1">
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
          <div className="h-40 animate-pulse rounded-lg bg-muted" />
        </div>
      </RouteEntitySheet>
    );
  }

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.SETTINGS_ROLES}
      description={
        isSystem
          ? "System roles can't be edited."
          : "Update the role name and permissions."
      }
      title={isSystem ? "View role" : "Edit role"}
    >
      <RoleForm
        defaultValues={defaultValues}
        errorMessage={
          (updateMutation.error as Error | null | undefined)?.message ??
          undefined
        }
        isPending={updateMutation.isPending}
        isReadOnly={isSystem}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.SETTINGS_ROLES, location.search),
          );
        }}
        onSubmit={handleSubmit}
        permissions={permissionsQuery.data}
        permissionsLoading={permissionsQuery.isLoading}
        submitLabel="Save changes"
      />
    </RouteEntitySheet>
  );
}

export function RoleSheetRoute({ mode }: RoleSheetRouteProps) {
  if (mode === "create") return <CreateRoleSheet />;
  return <EditRoleSheet />;
}
