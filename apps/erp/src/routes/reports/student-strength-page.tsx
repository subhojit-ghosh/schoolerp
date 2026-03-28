import { useEffect, useMemo, useState } from "react";
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
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useStudentStrengthQuery } from "@/features/reports/api/use-reports";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";

const ALL_FILTER_VALUE = "all";

export function StudentStrengthPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canView = isStaffContext(session);
  const canQuery = canView && Boolean(institutionId);
  const [academicYearId, setAcademicYearId] = useState<string>(ALL_FILTER_VALUE);
  const [campusId, setCampusId] = useState<string>(ALL_FILTER_VALUE);

  const academicYearsQuery = useAcademicYearsQuery(institutionId, {
    limit: 50,
  });
  const campusesQuery = useCampusesQuery(institutionId, { limit: 50 });

  const academicYearOptions = useMemo(
    () => academicYearsQuery.data?.rows ?? [],
    [academicYearsQuery.data?.rows],
  );
  const campusOptions = useMemo(
    () => campusesQuery.data?.rows ?? [],
    [campusesQuery.data?.rows],
  );

  const defaultAcademicYearId = useMemo(
    () =>
      academicYearOptions.find((ay) => ay.isCurrent)?.id ??
      academicYearOptions[0]?.id ??
      ALL_FILTER_VALUE,
    [academicYearOptions],
  );

  useEffect(() => {
    if (
      academicYearId === ALL_FILTER_VALUE &&
      defaultAcademicYearId !== ALL_FILTER_VALUE
    ) {
      setAcademicYearId(defaultAcademicYearId);
    }
  }, [academicYearId, defaultAcademicYearId]);

  const strengthQuery = useStudentStrengthQuery(canQuery, {
    academicYearId:
      academicYearId === ALL_FILTER_VALUE ? undefined : academicYearId,
    campusId: campusId === ALL_FILTER_VALUE ? undefined : campusId,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Strength</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to view this report.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canView) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student Strength</CardTitle>
          <CardDescription>
            Student strength report is available in Staff view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = strengthQuery.data;

  return (
    <EntityPageShell className="space-y-6" width="full">
      <EntityPageHeader
        description="View student count grouped by class and section."
        title="Student Strength"
      />

      <div className="grid gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:grid-cols-2">
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
                <SelectItem value={ALL_FILTER_VALUE}>
                  All academic years
                </SelectItem>
                {academicYearOptions.map((ay) => (
                  <SelectItem key={ay.id} value={ay.id}>
                    {ay.name}
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
                <SelectItem value={ALL_FILTER_VALUE}>All campuses</SelectItem>
                {campusOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {strengthQuery.isLoading ? (
        <Card>
          <CardContent className="space-y-3 py-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : strengthQuery.isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {(strengthQuery.error as Error | null | undefined)?.message ??
              "Could not load student strength report."}
          </CardContent>
        </Card>
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Strength by Class and Section
            </CardTitle>
            <CardDescription>
              Total students: {data.grandTotal}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.rows.length === 0 ? (
              <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                No enrolled students found for the selected filters.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                        Campus
                      </th>
                      <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                        Total Students
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.rows.map((row) => (
                      <tr
                        key={`${row.classId}-${row.sectionId}`}
                        className="hover:bg-muted/20"
                      >
                        <td className="px-6 py-3 font-medium">
                          {row.className}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {row.sectionName}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {row.campusName ?? "-"}
                        </td>
                        <td className="px-6 py-3 text-right tabular-nums font-medium">
                          {row.totalCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 bg-muted/20">
                      <td
                        className="px-6 py-3 font-semibold"
                        colSpan={3}
                      >
                        Grand Total
                      </td>
                      <td className="px-6 py-3 text-right tabular-nums font-semibold">
                        {data.grandTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </EntityPageShell>
  );
}
