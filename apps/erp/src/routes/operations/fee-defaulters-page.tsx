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
import { Button } from "@repo/ui/components/ui/button";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useFeeDefaultersQuery } from "@/features/fees/api/use-fees";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";
import { formatRupees } from "@/features/fees/model/fee-formatters";
import { formatAcademicYear } from "@/lib/format";

const ALL_FILTER_VALUE = "all";
const DEFAULT_PAGE_SIZE = 20;

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
        <p
          className={`mt-1 text-2xl font-bold tracking-tight ${valueClass ?? ""}`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function FeeDefaultersPage() {
  useDocumentTitle("Fee Defaulters");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canManageFees = isStaffContext(session);
  const canQuery = canManageFees && Boolean(institutionId);
  const [academicYearId, setAcademicYearId] = useState<string>(ALL_FILTER_VALUE);
  const [campusId, setCampusId] = useState<string>(ALL_FILTER_VALUE);
  const [classId, setClassId] = useState<string>(ALL_FILTER_VALUE);
  const [page, setPage] = useState(1);

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [academicYearId, campusId, classId]);

  const defaultersQuery = useFeeDefaultersQuery(canQuery, {
    academicYearId:
      academicYearId === ALL_FILTER_VALUE ? undefined : academicYearId,
    campusId: campusId === ALL_FILTER_VALUE ? undefined : campusId,
    classId: classId === ALL_FILTER_VALUE ? undefined : classId,
    page,
    limit: DEFAULT_PAGE_SIZE,
  });

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Defaulters</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to view this report.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageFees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Defaulters</CardTitle>
          <CardDescription>
            Fee defaulter reports are available in Staff view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const data = defaultersQuery.data;

  return (
    <EntityPageShell className="space-y-6" width="full">
      <EntityPageHeader
        description="Students with overdue fee payments."
        title="Fee Defaulters"
      />

      <div className="grid gap-4 rounded-xl border border-border/70 bg-card px-4 py-3 sm:grid-cols-3">
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
                    {formatAcademicYear(ay.name)}
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
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Class
          </p>
          <Select onValueChange={setClassId} value={classId}>
            <SelectTrigger>
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value={ALL_FILTER_VALUE}>All classes</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {defaultersQuery.isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, index) => (
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
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-8 w-full" />
              ))}
            </CardContent>
          </Card>
        </>
      ) : defaultersQuery.isError ? (
        <Card>
          <CardContent className="py-6 text-sm text-destructive">
            {(defaultersQuery.error as Error | null | undefined)?.message ??
              "Could not load fee defaulter report."}
          </CardContent>
        </Card>
      ) : data ? (
        <>
          <div className="grid grid-cols-2 gap-4">
            <SummaryCard
              label="Total defaulters"
              value={String(data.summaryDefaulterCount)}
              valueClass={
                data.summaryDefaulterCount > 0
                  ? "text-destructive"
                  : undefined
              }
            />
            <SummaryCard
              label="Total outstanding"
              value={formatRupees(data.summaryTotalOutstandingInPaise)}
              valueClass={
                data.summaryTotalOutstandingInPaise > 0
                  ? "text-destructive"
                  : undefined
              }
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Defaulter Details</CardTitle>
              <CardDescription>
                Showing {data.rows.length} of {data.total} defaulters
                {data.pageCount > 1 ? ` (page ${data.page} of ${data.pageCount})` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {data.rows.length === 0 ? (
                <p className="px-6 py-8 text-center text-sm text-muted-foreground">
                  No fee defaulters found for the selected filters.
                </p>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/40">
                          <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                            Student
                          </th>
                          <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                            Admission #
                          </th>
                          <th className="px-6 py-3 text-left font-medium text-muted-foreground">
                            Class / Section
                          </th>
                          <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                            Assigned
                          </th>
                          <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                            Paid
                          </th>
                          <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                            Outstanding
                          </th>
                          <th className="px-6 py-3 text-right font-medium text-muted-foreground">
                            Days Overdue
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {data.rows.map((row) => (
                          <tr
                            key={row.studentId}
                            className="hover:bg-muted/20"
                          >
                            <td className="px-6 py-3 font-medium">
                              {row.studentName}
                            </td>
                            <td className="px-6 py-3 text-muted-foreground">
                              {row.admissionNumber}
                            </td>
                            <td className="px-6 py-3 text-muted-foreground">
                              {row.className} / {row.sectionName}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums">
                              {formatRupees(row.totalAssignedInPaise)}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums text-green-600 dark:text-green-400">
                              {formatRupees(row.totalPaidInPaise)}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums font-medium text-destructive">
                              {formatRupees(row.totalOutstandingInPaise)}
                            </td>
                            <td className="px-6 py-3 text-right tabular-nums text-destructive">
                              {row.daysPastDue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {data.pageCount > 1 && (
                    <div className="flex items-center justify-between border-t px-6 py-3">
                      <p className="text-sm text-muted-foreground">
                        Page {data.page} of {data.pageCount}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          disabled={data.page <= 1}
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          size="sm"
                          variant="outline"
                        >
                          <IconChevronLeft className="size-4" />
                          Previous
                        </Button>
                        <Button
                          disabled={data.page >= data.pageCount}
                          onClick={() =>
                            setPage((p) => Math.min(data.pageCount, p + 1))
                          }
                          size="sm"
                          variant="outline"
                        >
                          Next
                          <IconChevronRight className="size-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </EntityPageShell>
  );
}
