import { Link, Outlet, useLocation } from "react-router";
import { toast } from "sonner";
import {
  IconPencil,
  IconPlus,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  EntityEmptyStateAction,
  EntityPagePrimaryAction,
} from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useLeaveTypesQuery,
  useUpdateLeaveTypeMutation,
} from "@/features/leave/api/use-leave";
import { LEAVE_TYPES_PAGE_COPY } from "@/features/leave/model/leave-list.constants";
import { appendSearch } from "@/lib/routes";

export function LeaveTypesPage() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const canManageLeave = hasPermission(session, PERMISSIONS.LEAVE_MANAGE);
  const canReadLeave = hasPermission(session, PERMISSIONS.LEAVE_READ);

  const typesQuery = useLeaveTypesQuery(canReadLeave);
  const updateMutation = useUpdateLeaveTypeMutation();

  const leaveTypes = typesQuery.data ?? [];

  async function handleToggleStatus(
    id: string,
    currentStatus: "active" | "inactive",
  ) {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    await updateMutation.mutateAsync({
      params: { path: { leaveTypeId: id } },
      body: { status: newStatus },
    });
    toast.success(
      newStatus === "active" ? "Leave type activated." : "Leave type deactivated.",
    );
  }

  return (
    <EntityListPage
      title={LEAVE_TYPES_PAGE_COPY.TITLE}
      description={LEAVE_TYPES_PAGE_COPY.DESCRIPTION}
      actions={
        canManageLeave ? (
          <EntityPagePrimaryAction asChild>
            <Link
              to={appendSearch(ERP_ROUTES.LEAVE_TYPES_CREATE, location.search)}
            >
              <IconPlus className="size-4" />
              New leave type
            </Link>
          </EntityPagePrimaryAction>
        ) : undefined
      }
    >
      {typesQuery.isLoading ? (
        <div className="border rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      ) : leaveTypes.length === 0 ? (
        <div className="border rounded-lg bg-card p-12 text-center">
          <p className="font-medium">{LEAVE_TYPES_PAGE_COPY.EMPTY_TITLE}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {LEAVE_TYPES_PAGE_COPY.EMPTY_DESCRIPTION}
          </p>
          {canManageLeave ? (
            <div className="mt-4">
              <EntityEmptyStateAction asChild>
                <Link
                  to={appendSearch(
                    ERP_ROUTES.LEAVE_TYPES_CREATE,
                    location.search,
                  )}
                >
                  <IconPlus className="size-4" />
                  New leave type
                </Link>
              </EntityEmptyStateAction>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="border rounded-lg bg-card divide-y">
          {leaveTypes.map((lt) => (
            <div
              key={lt.id}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{lt.name}</span>
                  {lt.isPaid ? (
                    <Badge variant="outline">Paid</Badge>
                  ) : (
                    <Badge variant="secondary">Unpaid</Badge>
                  )}
                  {lt.status === "inactive" ? (
                    <Badge variant="secondary">Inactive</Badge>
                  ) : null}
                </div>
                {lt.maxDaysPerYear ? (
                  <p className="text-xs text-muted-foreground">
                    Max {lt.maxDaysPerYear} days per year
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No annual limit
                  </p>
                )}
              </div>
              {canManageLeave ? (
                <div className="flex items-center gap-1">
                  <Button asChild size="sm" variant="ghost">
                    <Link
                      to={appendSearch(
                        `/leave/types/${lt.id}/edit`,
                        location.search,
                      )}
                    >
                      <IconPencil className="size-3" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      void handleToggleStatus(
                        lt.id,
                        lt.status as "active" | "inactive",
                      )
                    }
                  >
                    {lt.status === "active" ? (
                      <>
                        <IconToggleRight className="size-3" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <IconToggleLeft className="size-3" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
      <Outlet />
    </EntityListPage>
  );
}
