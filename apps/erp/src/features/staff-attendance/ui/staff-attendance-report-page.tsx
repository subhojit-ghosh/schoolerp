import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PERMISSIONS } from "@repo/contracts";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import { z } from "zod";

import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useStaffAttendanceReportQuery,
  type StaffAttendanceReportFilters,
} from "@/features/staff-attendance/api/use-staff-attendance";

const REPORT_PAGE_COPY = {
  TITLE: "Staff Attendance Report",
  DESCRIPTION: "View staff attendance summary over a date range.",
  EMPTY: "Select a date range and load the report.",
} as const;

const reportFilterSchema = z.object({
  fromDate: z.string().min(1, "Start date is required"),
  toDate: z.string().min(1, "End date is required"),
});

type ReportFilterValues = z.infer<typeof reportFilterSchema>;

const TODAY = new Date().toISOString().slice(0, 10);

// Default to first day of current month
function getFirstOfMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export function StaffAttendanceReportPage() {
  useDocumentTitle("Staff Attendance Report");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const activeCampusName = session?.activeCampus?.name;
  const canRead =
    isStaffContext(session) &&
    hasPermission(session, PERMISSIONS.STAFF_ATTENDANCE_READ);
  const managedInstitutionId = canRead ? institutionId : undefined;

  const [activeFilters, setActiveFilters] =
    useState<StaffAttendanceReportFilters | null>(null);

  const filterForm = useForm<ReportFilterValues>({
    resolver: zodResolver(reportFilterSchema),
    mode: "onTouched",
    defaultValues: {
      fromDate: getFirstOfMonth(),
      toDate: TODAY,
    },
  });

  const reportQuery = useStaffAttendanceReportQuery(
    managedInstitutionId,
    activeFilters,
  );

  function handleLoadReport(values: ReportFilterValues) {
    if (!activeCampusId) return;
    setActiveFilters({
      campusId: activeCampusId,
      fromDate: values.fromDate,
      toDate: values.toDate,
    });
  }

  const report = reportQuery.data;

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        description={REPORT_PAGE_COPY.DESCRIPTION}
        title={REPORT_PAGE_COPY.TITLE}
      />

      {!institutionId || !canRead ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Sign in with an institution-backed session to view staff attendance
          reports.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Filters toolbar */}
          <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
            <form onSubmit={filterForm.handleSubmit(handleLoadReport)}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Controller
                  control={filterForm.control}
                  name="fromDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>From Date</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          max={TODAY}
                          type="date"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
                <Controller
                  control={filterForm.control}
                  name="toDate"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid || undefined}>
                      <FieldLabel required>To Date</FieldLabel>
                      <FieldContent>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          max={TODAY}
                          type="date"
                        />
                        <FieldError>{fieldState.error?.message}</FieldError>
                      </FieldContent>
                    </Field>
                  )}
                />
              </div>
              {activeCampusName ? (
                <p className="mt-3 text-xs text-muted-foreground">
                  Working campus: {activeCampusName}
                </p>
              ) : null}
              <div className="mt-3 flex justify-end">
                <Button size="sm" type="submit">
                  Load report
                </Button>
              </div>
            </form>
          </div>

          {/* Report table */}
          <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
            {reportQuery.isLoading ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                Loading report...
              </div>
            ) : report && report.staff.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30">
                      <th className="px-5 py-3 text-left font-medium text-foreground">
                        Staff Name
                      </th>
                      <th className="px-5 py-3 text-left font-medium text-foreground">
                        Designation
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-green-700 dark:text-green-400">
                        Present
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-red-600 dark:text-red-400">
                        Absent
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-amber-600 dark:text-amber-400">
                        Half Day
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-blue-600 dark:text-blue-400">
                        On Leave
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-foreground">
                        Total
                      </th>
                      <th className="px-3 py-3 text-center font-medium text-foreground">
                        %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {report.staff.map((row) => (
                      <tr key={row.membershipId}>
                        <td className="px-5 py-3 font-medium text-foreground">
                          {row.staffName}
                        </td>
                        <td className="px-5 py-3 text-muted-foreground">
                          {row.designation ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-center text-green-700 dark:text-green-400">
                          {row.present}
                        </td>
                        <td className="px-3 py-3 text-center text-red-600 dark:text-red-400">
                          {row.absent}
                        </td>
                        <td className="px-3 py-3 text-center text-amber-600 dark:text-amber-400">
                          {row.halfDay}
                        </td>
                        <td className="px-3 py-3 text-center text-blue-600 dark:text-blue-400">
                          {row.onLeave}
                        </td>
                        <td className="px-3 py-3 text-center">
                          {row.totalMarkedDays}
                        </td>
                        <td className="px-3 py-3 text-center font-semibold">
                          {row.attendancePercent}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : report && report.staff.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No staff records found for this campus and date range.
              </div>
            ) : (
              <div className="py-16 text-center text-sm text-muted-foreground">
                {REPORT_PAGE_COPY.EMPTY}
              </div>
            )}
          </div>
        </div>
      )}
    </EntityPageShell>
  );
}
