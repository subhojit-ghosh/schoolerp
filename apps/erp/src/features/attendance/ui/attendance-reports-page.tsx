import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ATTENDANCE_STATUS_LABELS } from "@repo/contracts";
import { IconSearch } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { cn } from "@repo/ui/lib/utils";

import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useAttendanceClassReportQuery,
  useAttendanceClassSectionsQuery,
  useAttendanceStudentReportQuery,
} from "@/features/attendance/api/use-attendance";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import type { components } from "@/lib/api/generated/schema";

const MONTH_AGO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  .toISOString()
  .slice(0, 10);
const TODAY = new Date().toISOString().slice(0, 10);

const REPORT_TAB_VALUES = {
  BY_CLASS: "by-class",
  BY_STUDENT: "by-student",
} as const;

const classReportSchema = z.object({
  campusId: z.string().min(1, "Campus is required"),
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

const studentReportSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

type ClassReportValues = z.infer<typeof classReportSchema>;
type StudentReportValues = z.infer<typeof studentReportSchema>;

const STATUS_BADGE_CLASS: Record<string, string> = {
  present:
    "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  absent:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-400",
  late: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400",
  excused:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
};

function AttendancePercent({ value }: { value: number }) {
  const color =
    value >= 90
      ? "text-green-700 dark:text-green-400"
      : value >= 75
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";
  return (
    <span className={cn("font-semibold tabular-nums", color)}>
      {value.toFixed(1)}%
    </span>
  );
}

type ClassReportStudent =
  components["schemas"]["AttendanceClassReportStudentDto"];

function ClassReportTab({
  institutionId,
  campuses,
}: {
  institutionId: string | undefined;
  campuses: { id: string; name: string }[];
}) {
  const [activeFilters, setActiveFilters] = useState<ClassReportValues | null>(
    null,
  );

  const form = useForm<ClassReportValues>({
    resolver: zodResolver(classReportSchema),
    defaultValues: {
      campusId: "",
      classId: "",
      sectionId: "",
      startDate: MONTH_AGO,
      endDate: TODAY,
    },
  });

  const campusId = form.watch("campusId");
  const classId = form.watch("classId");

  const classSectionsQuery = useAttendanceClassSectionsQuery(
    institutionId,
    campusId || undefined,
  );
  const classSections = classSectionsQuery.data ?? [];
  const uniqueClasses = Array.from(
    new Map(
      classSections.map((item) => [item.classId, item.className]),
    ).entries(),
  );
  const sectionsForClass = classSections.filter(
    (item) => item.classId === classId,
  );

  const reportQuery = useAttendanceClassReportQuery(
    institutionId,
    activeFilters,
  );
  const report = reportQuery.data;

  function handleSubmit(values: ClassReportValues) {
    setActiveFilters(values);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Controller
              control={form.control}
              name="campusId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Campus</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("classId", "");
                        form.setValue("sectionId", "");
                      }}
                      value={field.value || undefined}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select campus" />
                      </SelectTrigger>
                      <SelectContent>
                        {campuses.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="classId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Class</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("sectionId", "");
                      }}
                      value={field.value || undefined}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        {uniqueClasses.map(([cId, cName]) => (
                          <SelectItem key={cId} value={cId}>
                            {cName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="sectionId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Section</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select section" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectionsForClass.map((item) => (
                          <SelectItem key={item.sectionId} value={item.sectionId}>
                            {item.sectionName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>From</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="endDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>To</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      type="date"
                      max={TODAY}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" type="submit">
              <IconSearch className="mr-1.5 size-3.5" />
              Generate report
            </Button>
          </div>
        </form>
      </div>

      {/* Report table */}
      {reportQuery.isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-sm text-muted-foreground">
          Generating report…
        </div>
      ) : report ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          {/* Report header */}
          <div className="border-b border-border/70 px-5 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">
                {report.className} — {report.sectionName}
              </span>
              <Badge variant="secondary">{report.campusName}</Badge>
              <span className="text-sm text-muted-foreground">
                {report.startDate} to {report.endDate}
              </span>
            </div>
          </div>

          {/* Summary row */}
          {report.dates.length > 0 && (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px] sticky left-0 bg-card">
                      Student
                    </TableHead>
                    <TableHead className="text-center">P</TableHead>
                    <TableHead className="text-center">A</TableHead>
                    <TableHead className="text-center">L</TableHead>
                    <TableHead className="text-center">E</TableHead>
                    <TableHead className="text-right">Attendance %</TableHead>
                    {report.dates.map((d) => (
                      <TableHead key={d} className="text-center text-xs">
                        {d.slice(5)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.students.map((student: ClassReportStudent) => (
                    <TableRow key={student.studentId}>
                      <TableCell className="sticky left-0 bg-card">
                        <p className="text-sm font-medium">{student.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {student.admissionNumber}
                        </p>
                      </TableCell>
                      <TableCell className="text-center text-green-700 dark:text-green-400">
                        {student.present}
                      </TableCell>
                      <TableCell className="text-center text-red-600 dark:text-red-400">
                        {student.absent}
                      </TableCell>
                      <TableCell className="text-center text-amber-600 dark:text-amber-400">
                        {student.late}
                      </TableCell>
                      <TableCell className="text-center text-blue-600 dark:text-blue-400">
                        {student.excused}
                      </TableCell>
                      <TableCell className="text-right">
                        <AttendancePercent value={student.attendancePercent} />
                      </TableCell>
                      {report.dates.map((d) => {
                        const status = student.records[d];
                        return (
                          <TableCell key={d} className="text-center">
                            {status ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] px-1 py-0",
                                  STATUS_BADGE_CLASS[status] ?? "",
                                )}
                              >
                                {ATTENDANCE_STATUS_LABELS[
                                  status as keyof typeof ATTENDANCE_STATUS_LABELS
                                ]?.charAt(0) ?? status.charAt(0).toUpperCase()}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {report.dates.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No attendance records found for this period.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 py-16 text-center text-sm text-muted-foreground">
          Select a class, section, and date range, then generate the report.
        </div>
      )}
    </div>
  );
}

function StudentReportTab({
  institutionId,
}: {
  institutionId: string | undefined;
}) {
  const [activeFilters, setActiveFilters] =
    useState<StudentReportValues | null>(null);

  const form = useForm<StudentReportValues>({
    resolver: zodResolver(studentReportSchema),
    defaultValues: {
      studentId: "",
      startDate: MONTH_AGO,
      endDate: TODAY,
    },
  });

  const studentOptionsQuery = useStudentOptionsQuery(institutionId);
  const studentOptions = studentOptionsQuery.data ?? [];

  const reportQuery = useAttendanceStudentReportQuery(
    institutionId,
    activeFilters,
  );
  const report = reportQuery.data;

  function handleSubmit(values: StudentReportValues) {
    setActiveFilters(values);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Filters */}
      <div className="rounded-xl border border-border/70 bg-card px-4 py-4">
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Controller
              control={form.control}
              name="studentId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>Student</FieldLabel>
                  <FieldContent>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || undefined}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentOptions.map(
                          (s: { id: string; fullName: string; admissionNumber: string }) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.fullName} ({s.admissionNumber})
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="startDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>From</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      type="date"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="endDate"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel>To</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      type="date"
                      max={TODAY}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
          </div>
          <div className="mt-3 flex justify-end">
            <Button size="sm" type="submit">
              <IconSearch className="mr-1.5 size-3.5" />
              Generate report
            </Button>
          </div>
        </form>
      </div>

      {/* Report */}
      {reportQuery.isLoading ? (
        <div className="rounded-xl border border-border/70 bg-card py-16 text-center text-sm text-muted-foreground">
          Generating report…
        </div>
      ) : report ? (
        <div className="overflow-hidden rounded-xl border border-border/70 bg-card">
          {/* Student info header */}
          <div className="border-b border-border/70 px-5 py-4">
            <div className="flex flex-wrap items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{report.fullName}</p>
                <p className="text-sm text-muted-foreground">
                  {report.admissionNumber} · {report.className} —{" "}
                  {report.sectionName} · {report.campusName}
                </p>
              </div>
              <div className="flex flex-wrap gap-6 text-sm">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Present</p>
                  <p className="font-semibold text-green-700 dark:text-green-400">
                    {report.present}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Absent</p>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    {report.absent}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Late</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400">
                    {report.late}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Excused</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400">
                    {report.excused}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Attendance</p>
                  <AttendancePercent value={report.attendancePercent} />
                </div>
              </div>
            </div>
          </div>

          {/* Daily records */}
          {report.records.length > 0 ? (
            <div className="divide-y divide-border/60">
              {report.records.map(
                (rec: components["schemas"]["AttendanceStudentRecordDto"]) => (
                  <div
                    key={rec.date}
                    className="flex items-center justify-between gap-4 px-5 py-2.5"
                  >
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {rec.date}
                    </span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs",
                        STATUS_BADGE_CLASS[rec.status] ?? "",
                      )}
                    >
                      {ATTENDANCE_STATUS_LABELS[
                        rec.status as keyof typeof ATTENDANCE_STATUS_LABELS
                      ] ?? rec.status}
                    </Badge>
                  </div>
                ),
              )}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No attendance records found for this period.
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 py-16 text-center text-sm text-muted-foreground">
          Select a student and date range, then generate the report.
        </div>
      )}
    </div>
  );
}

export function AttendanceReportsPage() {
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const canViewReports = isStaffContext(session);
  const campuses = session?.campuses ?? [];

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Attendance Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Analyse class and student attendance over any date range.
        </p>
      </div>

      {!institutionId || !canViewReports ? (
        <div className="rounded-xl border border-dashed bg-muted/20 px-6 py-16 text-center text-sm text-muted-foreground">
          Attendance reports are available in Staff view.
        </div>
      ) : (
        <Tabs defaultValue={REPORT_TAB_VALUES.BY_CLASS}>
          <TabsList>
            <TabsTrigger value={REPORT_TAB_VALUES.BY_CLASS}>
              By Class
            </TabsTrigger>
            <TabsTrigger value={REPORT_TAB_VALUES.BY_STUDENT}>
              By Student
            </TabsTrigger>
          </TabsList>

          <TabsContent value={REPORT_TAB_VALUES.BY_CLASS} className="mt-4">
            <ClassReportTab
              institutionId={institutionId}
              campuses={campuses}
            />
          </TabsContent>

          <TabsContent value={REPORT_TAB_VALUES.BY_STUDENT} className="mt-4">
            <StudentReportTab institutionId={institutionId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
