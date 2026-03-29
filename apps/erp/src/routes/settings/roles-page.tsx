import { useMemo, useState } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { IconPlus } from "@tabler/icons-react";
import { PERMISSIONS } from "@repo/contracts";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
  EntityRowAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  ERP_ROUTES,
  ERP_ROUTE_SEGMENTS,
  buildRoleEditRoute,
} from "@/constants/routes";
import {
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useDeleteRoleMutation,
  useRolesQuery,
} from "@/features/roles/api/use-roles";
import { ROLES_PAGE_COPY } from "@/features/roles/model/role-list.constants";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";

type Role = {
  id: string;
  name: string;
  slug: string;
  isSystem: boolean;
  isConfigurable: boolean;
  permissions: { id: string; slug: string }[];
};

type DeleteDialogState = { roleId: string; roleName: string } | null;

export function RolesPage() {
  useDocumentTitle("Roles");
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManage =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.INSTITUTION_ROLES_MANAGE);

  const rolesQuery = useRolesQuery(Boolean(institutionId) && canManage);
  const deleteMutation = useDeleteRoleMutation();

  const [deleteDialog, setDeleteDialog] = useState<DeleteDialogState>(null);

  const roles = useMemo(
    () => (rolesQuery.data ?? []) as Role[],
    [rolesQuery.data],
  );

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ROLES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage roles.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{ROLES_PAGE_COPY.TITLE}</CardTitle>
          <CardDescription>
            {isStaffContext(session)
              ? "You do not have permission to manage roles for this institution."
              : `Role management is available in Staff view. You are currently in ${activeContext?.label ?? "another"} view.`}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleDelete() {
    if (!deleteDialog) return;
    try {
      await deleteMutation.mutateAsync({
        params: { path: { roleId: deleteDialog.roleId } },
      });
      toast.success(ERP_TOAST_MESSAGES.deleted(ERP_TOAST_SUBJECTS.ROLE));
      setDeleteDialog(null);
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not delete role. Please try again."),
      );
    }
  }

  const isEmpty = roles.length === 0;

  return (
    <>
      <EntityListPage
        actions={
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(
                `${ERP_ROUTES.SETTINGS_ROLES}/${ERP_ROUTE_SEGMENTS.NEW}`,
                location.search,
              )}
            >
              <IconPlus className="size-4" />
              New role
            </Link>
          </EntityPagePrimaryAction>
        }
        description={ROLES_PAGE_COPY.DESCRIPTION}
        title={ROLES_PAGE_COPY.TITLE}
      >
        {rolesQuery.isLoading ? (
          <div className="divide-y">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="space-y-1">
                  <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : rolesQuery.isError ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            {ROLES_PAGE_COPY.ERROR_TITLE}
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <div className="space-y-1">
              <p className="font-medium">{ROLES_PAGE_COPY.EMPTY_TITLE}</p>
              <p className="text-sm text-muted-foreground">
                {ROLES_PAGE_COPY.EMPTY_DESCRIPTION}
              </p>
            </div>
            <EntityEmptyStateAction asChild>
              <Link
                to={appendSearch(
                  `${ERP_ROUTES.SETTINGS_ROLES}/${ERP_ROUTE_SEGMENTS.NEW}`,
                  location.search,
                )}
              >
                <IconPlus className="size-4" />
                New role
              </Link>
            </EntityEmptyStateAction>
          </div>
        ) : (
          <div className="divide-y">
            {roles.map((role) => (
              <div
                key={role.id}
                className="flex items-center justify-between px-6 py-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{role.name}</span>
                    {role.isSystem ? (
                      <Badge variant="secondary">System</Badge>
                    ) : (
                      <Badge variant="outline">Custom</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {role.permissions.length === 0
                      ? "No permissions"
                      : `${role.permissions.length} permission${role.permissions.length === 1 ? "" : "s"}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <EntityRowAction asChild>
                    <Link
                      to={appendSearch(
                        buildRoleEditRoute(role.id),
                        location.search,
                      )}
                    >
                      {role.isSystem ? "View" : "Edit"}
                    </Link>
                  </EntityRowAction>
                  {!role.isSystem ? (
                    <EntityRowAction
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                      onClick={() =>
                        setDeleteDialog({
                          roleId: role.id,
                          roleName: role.name,
                        })
                      }
                      type="button"
                    >
                      Delete
                    </EntityRowAction>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </EntityListPage>

      <Outlet />

      <AlertDialog
        open={Boolean(deleteDialog)}
        onOpenChange={(open) => {
          if (!open) setDeleteDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role</AlertDialogTitle>
            <AlertDialogDescription>
              Delete &ldquo;{deleteDialog?.roleName}&rdquo;? This cannot be
              undone. The role must have no active staff assignments to be
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
              onClick={handleDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete role"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
