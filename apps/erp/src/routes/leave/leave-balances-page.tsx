import { useState, useCallback } from "react";
import { toast } from "sonner";
import { IconScale } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  EntityPageShell,
  EntityPageHeader,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  useLeaveBalancesQuery,
  useAllocateLeaveBalancesMutation,
} from "@/features/leave/api/use-leave";
import { extractApiError } from "@/lib/api-error";

export function LeaveBalancesPage() {
  useDocumentTitle("Leave Balances");
  const session = useAuthStore((store) => store.session);
  const isEnabled = isStaffContext(session);
  const institutionId = session?.activeOrganization?.id;

  const academicYearsQuery = useAcademicYearsQuery(institutionId, {
    sort: "startDate",
    order: "desc",
  });
  const academicYears = academicYearsQuery.data?.rows ?? [];
  const currentYear = academicYears.find((y) => y.isCurrent);
  const [selectedYearId, setSelectedYearId] = useState<string>("");
  const activeYearId = selectedYearId || currentYear?.id || "";

  const balancesQuery = useLeaveBalancesQuery(
    isEnabled && Boolean(activeYearId),
    {
      academicYearId: activeYearId,
    },
  );
  const balances = balancesQuery.data ?? [];

  const allocateMutation = useAllocateLeaveBalancesMutation();

  const handleAllocate = useCallback(async () => {
    if (!activeYearId) return;
    try {
      await allocateMutation.mutateAsync(activeYearId);
      toast.success("Leave balances allocated for all staff");
    } catch (error) {
      toast.error(extractApiError(error, "Failed to allocate leave balances"));
    }
  }, [activeYearId, allocateMutation]);

  // Group balances by staff member
  const staffMap = new Map<
    string,
    { staffName: string; balances: typeof balances }
  >();
  for (const b of balances) {
    const existing = staffMap.get(b.staffMemberId);
    if (existing) {
      existing.balances.push(b);
    } else {
      staffMap.set(b.staffMemberId, {
        staffName: b.staffName,
        balances: [b],
      });
    }
  }

  return (
    <EntityPageShell>
      <EntityPageHeader
        title="Leave Balances"
        description="Track leave allocation and consumption per staff member"
      />
      <div className="flex flex-wrap items-center gap-3">
        <Select value={activeYearId} onValueChange={setSelectedYearId}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select academic year" />
          </SelectTrigger>
          <SelectContent>
            {academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.name}
                {year.isCurrent ? " (Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          className="h-9"
          disabled={!activeYearId || allocateMutation.isPending}
          onClick={handleAllocate}
        >
          <IconScale className="mr-1.5 size-4" />
          {allocateMutation.isPending ? "Allocating..." : "Allocate balances"}
        </Button>
      </div>

      {balances.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16">
          <p className="text-sm text-muted-foreground">
            No leave balances found for this academic year.
          </p>
          <p className="text-xs text-muted-foreground">
            Click "Allocate balances" to create balances based on leave type
            quotas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {Array.from(staffMap.entries()).map(([memberId, staff]) => (
            <div
              key={memberId}
              className="rounded-xl border bg-card overflow-hidden"
            >
              <div className="border-b px-4 py-3 bg-muted/30">
                <p className="text-sm font-semibold">{staff.staffName}</p>
              </div>
              <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {staff.balances.map((b) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="text-sm font-medium">{b.leaveTypeName}</p>
                      <p className="text-xs text-muted-foreground">
                        {b.allocated} allocated
                        {b.carriedForward > 0
                          ? ` + ${b.carriedForward} carried`
                          : ""}
                        {" · "}
                        {b.used} used
                      </p>
                    </div>
                    <Badge
                      variant={b.remaining > 0 ? "secondary" : "destructive"}
                    >
                      {b.remaining} left
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </EntityPageShell>
  );
}
