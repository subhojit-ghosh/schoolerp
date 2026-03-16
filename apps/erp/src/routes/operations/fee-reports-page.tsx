import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useCollectionSummaryQuery } from "@/features/fees/api/use-fees";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";
import { formatRupees } from "@/features/fees/model/fee-formatters";

function SummaryCard({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 text-2xl font-bold tracking-tight ${valueClass ?? ""}`}>
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function FeeReportsPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canManageFees = isStaffContext(session);
  const canQuery = canManageFees && Boolean(institutionId);
  const [academicYearId, setAcademicYearId] = useState<string>("all");
  const [campusId, setCampusId] = useState<string>("all");

  const academicYearsQuery = useAcademicYearsQuery(institutionId, { limit: 50 });
  const campusesQuery = useCampusesQuery(institutionId, { limit: 50 });

  const summaryQuery = useCollectionSummaryQuery(canQuery, {
    academicYearId: academicYearId === "all" ? undefined : academicYearId,
    campusId: campusId === "all" ? undefined : campusId,
  });

  const academicYearOptions = useMemo(
    () => academicYearsQuery.data?.rows ?? [],
    [academicYearsQuery.data?.rows],
  );
  const campusOptions = useMemo(
    () => campusesQuery.data?.rows ?? [],
    [campusesQuery.data?.rows],
  );

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Reports</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to view fee reports.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Reports</CardTitle>
          <CardDescription>
            Fee reports are available in Staff view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = summaryQuery.data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Fee Reports</h1>
        <p className="text-sm text-muted-foreground">
          Overview of fee collection across all structures.
        </p>
      </div>

      <div className="grid gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Academic year
          </p>
          <Select onValueChange={setAcademicYearId} value={academicYearId}>
            <SelectTrigger>
              <SelectValue placeholder="All academic years" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All academic years</SelectItem>
                {academicYearOptions.map((academicYear) => (
                  <SelectItem key={academicYear.id} value={academicYear.id}>
                    {academicYear.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Campus
          </p>
          <Select onValueChange={setCampusId} value={campusId}>
            <SelectTrigger>
              <SelectValue placeholder="All campuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All campuses</SelectItem>
                {campusOptions.map((campus) => (
                  <SelectItem key={campus.id} value={campus.id}>
                    {campus.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {summaryQuery.isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="space-y-3 pt-6">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardContent className="space-y-3 py-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </>
      ) : summaryQuery.isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {(summaryQuery.error as Error | null | undefined)?.message ??
              "Could not load fee reports."}
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard
              label="Total assigned"
              value={formatRupees(data.totalAssignedInPaise)}
            />
            <SummaryCard
              label="Total collected"
              value={formatRupees(data.totalPaidInPaise)}
              valueClass="text-green-600 dark:text-green-400"
            />
            <SummaryCard
              label="Total outstanding"
              value={formatRupees(data.totalOutstandingInPaise)}
              valueClass={
                data.totalOutstandingInPaise > 0
                  ? "text-destructive"
                  : undefined
              }
            />
            <SummaryCard
              label="Overdue assignments"
              value={String(data.overdueCount)}
              valueClass={
                data.overdueCount > 0 ? "text-destructive" : undefined
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Collection by Structure</CardTitle>
              <CardDescription>
                Fee collection breakdown per fee structure.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.byStructure.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No fee structures with assignments yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          Structure
                        </th>
                        <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                          Academic Year
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Students
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Assigned
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Collected
                        </th>
                        <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                          Outstanding
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.byStructure.map((item) => (
                        <tr
                          key={item.feeStructureId}
                          className="hover:bg-muted/20"
                        >
                          <td className="px-6 py-3 font-medium">
                            {item.feeStructureName}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {item.academicYearName}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums">
                            {item.assignmentCount}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums">
                            {formatRupees(item.totalAssignedInPaise)}
                          </td>
                          <td className="px-6 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                            {formatRupees(item.totalPaidInPaise)}
                          </td>
                          <td
                            className={`px-6 py-3 text-right tabular-nums font-medium ${
                              item.totalOutstandingInPaise > 0
                                ? "text-destructive"
                                : ""
                            }`}
                          >
                            {formatRupees(item.totalOutstandingInPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
