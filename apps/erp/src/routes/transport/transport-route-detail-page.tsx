import { useMemo } from "react";
import { Link, Outlet, useLocation, useParams } from "react-router";
import {
  IconArrowLeft,
  IconClock,
  IconDotsVertical,
  IconMapPin,
  IconPencil,
  IconPlus,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { EntityPagePrimaryAction, EntityRowAction } from "@/components/entities/entity-actions";
import { PERMISSIONS } from "@repo/contracts";
import {
  ERP_ROUTES,
  buildTransportRouteEditRoute,
  buildTransportRouteStopCreateRoute,
  buildTransportRouteStopEditRoute,
} from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useTransportRouteQuery,
  useUpdateStopMutation,
} from "@/features/transport/api/use-transport";
import { appendSearch } from "@/lib/routes";
import { toast } from "sonner";

type StopRow = {
  id: string;
  name: string;
  sequenceNumber: number;
  pickupTime: string | null;
  dropTime: string | null;
  status: "active" | "inactive";
};

export function TransportRouteDetailPage() {
  const location = useLocation();
  const { routeId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.TRANSPORT_READ);
  const canManage = hasPermission(session, PERMISSIONS.TRANSPORT_MANAGE);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const routeQuery = useTransportRouteQuery(routeId ?? "", canRead && Boolean(routeId)) as any;
  const updateStopMutation = useUpdateStopMutation(routeId ?? "");

  const route = routeQuery.data;
  const stops: StopRow[] = useMemo(
    () => (route?.stops ?? []) as StopRow[],
    [route],
  );
  const sortedStops = useMemo(
    () => [...stops].sort((a, b) => a.sequenceNumber - b.sequenceNumber),
    [stops],
  );

  async function handleToggleStopStatus(stop: StopRow) {
    const newStatus = stop.status === "active" ? "inactive" : "active";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (updateStopMutation as any).mutateAsync({
      params: { path: { routeId: routeId ?? "", stopId: stop.id } },
      body: { status: newStatus },
    });
    toast.success(
      newStatus === "active" ? "Stop activated." : "Stop deactivated.",
    );
  }

  if (routeQuery.isLoading) {
    return (
      <EntityPageShell>
        <div className="text-muted-foreground py-12 text-center text-sm">
          Loading route...
        </div>
      </EntityPageShell>
    );
  }

  if (!route) {
    return (
      <EntityPageShell>
        <div className="text-muted-foreground py-12 text-center text-sm">
          Route not found.
        </div>
      </EntityPageShell>
    );
  }

  return (
    <>
      <EntityPageShell className="p-6">
        <EntityDetailPageHeader
          title={route.name}
          backAction={
            <Link
              className="text-muted-foreground hover:text-foreground mb-1 inline-flex items-center gap-1 text-sm"
              to={appendSearch(ERP_ROUTES.TRANSPORT_ROUTES, location.search)}
            >
              <IconArrowLeft className="size-4" />
              Transport Routes
            </Link>
          }
          badges={
            route.status === "active" ? (
              <Badge className="bg-green-500/10 text-green-700 border-green-200">
                Active
              </Badge>
            ) : (
              <Badge variant="secondary">Inactive</Badge>
            )
          }
          meta={
            <span>
              {route.description ?? "No description"}
              {route.campusName ? ` · ${route.campusName}` : ""}
            </span>
          }
          actions={
            canManage ? (
              <Button asChild variant="outline" className="h-9 rounded-lg">
                <Link
                  to={appendSearch(
                    buildTransportRouteEditRoute(routeId ?? ""),
                    location.search,
                  )}
                >
                  <IconPencil className="mr-2 size-4" />
                  Edit route
                </Link>
              </Button>
            ) : undefined
          }
        />

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Stops</CardTitle>
                <CardDescription>
                  Stops on this route, ordered by sequence number.
                </CardDescription>
              </div>
              {canManage ? (
                <EntityPagePrimaryAction asChild>
                  <Link
                    to={appendSearch(
                      buildTransportRouteStopCreateRoute(routeId ?? ""),
                      location.search,
                    )}
                  >
                    <IconPlus className="size-4" />
                    New stop
                  </Link>
                </EntityPagePrimaryAction>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {sortedStops.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <IconMapPin className="text-muted-foreground size-10" />
                <p className="text-muted-foreground text-sm">
                  No stops yet. Add stops to define where this route picks up
                  and drops off students.
                </p>
                {canManage ? (
                  <Button asChild size="sm" className="h-9 rounded-lg">
                    <Link
                      to={appendSearch(
                        buildTransportRouteStopCreateRoute(routeId ?? ""),
                        location.search,
                      )}
                    >
                      <IconPlus className="mr-2 size-4" />
                      New stop
                    </Link>
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y">
                {sortedStops.map((stop) => (
                  <div
                    key={stop.id}
                    className="flex items-center justify-between gap-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="bg-muted text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-medium">
                        {stop.sequenceNumber}
                      </span>
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-sm font-medium truncate">
                          {stop.name}
                        </p>
                        {stop.pickupTime || stop.dropTime ? (
                          <p className="text-muted-foreground flex items-center gap-2 text-xs">
                            <IconClock className="size-3 shrink-0" />
                            {stop.pickupTime ? `Pickup ${stop.pickupTime}` : ""}
                            {stop.pickupTime && stop.dropTime ? " · " : ""}
                            {stop.dropTime ? `Drop ${stop.dropTime}` : ""}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {stop.status === "inactive" ? (
                        <Badge variant="secondary">Inactive</Badge>
                      ) : null}
                      {canManage ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <EntityRowAction aria-label="Stop actions">
                              <IconDotsVertical className="size-4" />
                            </EntityRowAction>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                to={appendSearch(
                                  buildTransportRouteStopEditRoute(
                                    routeId ?? "",
                                    stop.id,
                                  ),
                                  location.search,
                                )}
                              >
                                <IconPencil className="mr-2 size-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                void handleToggleStopStatus(stop)
                              }
                            >
                              {stop.status === "active"
                                ? "Deactivate"
                                : "Activate"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </EntityPageShell>
      <Outlet />
    </>
  );
}
