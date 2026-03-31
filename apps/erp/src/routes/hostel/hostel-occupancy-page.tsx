import { IconBuilding, IconBed, IconUsers } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { PERMISSIONS } from "@repo/contracts";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useOccupancyDashboardQuery } from "@/features/hostel/api/use-hostel";
import { OCCUPANCY_PAGE_COPY } from "@/features/hostel/model/hostel-constants";

type BuildingOccupancy = {
  buildingId: string;
  buildingName: string;
  totalCapacity: number;
  totalOccupancy: number;
  availableBeds: number;
  occupancyPercent: number;
};

type FloorOccupancy = {
  buildingId: string;
  buildingName: string;
  floor: number;
  totalCapacity: number;
  totalOccupancy: number;
  availableBeds: number;
  occupancyPercent: number;
};

function OccupancyBar({ percent }: { percent: number }) {
  const barColor =
    percent >= 90
      ? "bg-destructive"
      : percent >= 70
        ? "bg-yellow-500"
        : "bg-primary";

  return (
    <div className="flex items-center gap-3">
      <div className="h-2.5 flex-1 rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <span className="text-sm font-medium tabular-nums w-12 text-right">
        {percent.toFixed(0)}%
      </span>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | number;
  icon: typeof IconBuilding;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description ? (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

export function HostelOccupancyPage() {
  useDocumentTitle("Occupancy Dashboard");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.HOSTEL_READ);

  const dashboardQuery = useOccupancyDashboardQuery(canRead);
  const data = dashboardQuery.data;

  const isLoading = dashboardQuery.isLoading;
  const errorMessage = (dashboardQuery.error as Error | null | undefined)
    ?.message;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {OCCUPANCY_PAGE_COPY.TITLE}
          </h1>
          <p className="text-muted-foreground">
            {OCCUPANCY_PAGE_COPY.DESCRIPTION}
          </p>
        </div>
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          Loading occupancy data...
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {OCCUPANCY_PAGE_COPY.TITLE}
          </h1>
          <p className="text-muted-foreground">
            {OCCUPANCY_PAGE_COPY.DESCRIPTION}
          </p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-destructive font-medium">
              Failed to load occupancy data
            </p>
            <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const buildings = (data?.buildings ?? []) as BuildingOccupancy[];
  const floors = (data?.floors ?? []) as FloorOccupancy[];
  const totalCapacity = data?.totalCapacity ?? 0;
  const totalOccupancy = data?.totalOccupancy ?? 0;
  const totalAvailable = data?.totalAvailable ?? 0;
  const overallPercent = data?.overallOccupancyPercent ?? 0;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {OCCUPANCY_PAGE_COPY.TITLE}
        </h1>
        <p className="text-muted-foreground">
          {OCCUPANCY_PAGE_COPY.DESCRIPTION}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Capacity"
          value={totalCapacity}
          icon={IconBed}
          description="Total beds across all hostels"
        />
        <StatCard
          title="Occupied"
          value={totalOccupancy}
          icon={IconUsers}
          description={`${overallPercent.toFixed(1)}% occupancy`}
        />
        <StatCard
          title="Available"
          value={totalAvailable}
          icon={IconBed}
          description="Beds available for allocation"
        />
        <StatCard
          title="Buildings"
          value={buildings.length}
          icon={IconBuilding}
          description="Active hostel buildings"
        />
      </div>

      {/* Overall occupancy bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Occupancy</CardTitle>
          <CardDescription>
            {totalOccupancy} of {totalCapacity} beds occupied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OccupancyBar percent={overallPercent} />
        </CardContent>
      </Card>

      {/* Per-building breakdown */}
      {buildings.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Building-wise Occupancy</CardTitle>
            <CardDescription>
              Occupancy breakdown by hostel building
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {buildings.map((building) => (
              <div key={building.buildingId} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{building.buildingName}</span>
                  <span className="text-muted-foreground">
                    {building.totalOccupancy} / {building.totalCapacity} beds (
                    {building.availableBeds} free)
                  </span>
                </div>
                <OccupancyBar percent={building.occupancyPercent} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      {/* Per-floor breakdown */}
      {floors.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Floor-wise Occupancy</CardTitle>
            <CardDescription>
              Occupancy breakdown by floor across buildings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {floors.map((floor) => (
              <div
                key={`${floor.buildingId}-${floor.floor}`}
                className="space-y-1.5"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {floor.buildingName} - Floor {floor.floor}
                  </span>
                  <span className="text-muted-foreground">
                    {floor.totalOccupancy} / {floor.totalCapacity} beds (
                    {floor.availableBeds} free)
                  </span>
                </div>
                <OccupancyBar percent={floor.occupancyPercent} />
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
