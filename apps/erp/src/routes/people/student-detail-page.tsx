import { ATTENDANCE_STATUS_LABELS, ATTENDANCE_STATUSES } from "@repo/contracts";
import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  IconCalendarStats,
  IconChevronLeft,
  IconCurrencyRupee,
  IconEdit,
  IconReceipt,
  IconReportAnalytics,
  IconSchool,
  IconTimeline,
  IconUsers,
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
import { Separator } from "@repo/ui/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import {
  ERP_ROUTES,
} from "@/constants/routes";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { formatFeeDate, formatRupees } from "@/features/fees/model/fee-formatters";
import {
  useStudentSummaryQuery,
  useUpdateStudentMutation,
} from "@/features/students/api/use-students";
import {
  EMPTY_CURRENT_ENROLLMENT,
  toStudentMutationBody,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";
import { StudentForm } from "@/features/students/ui/student-form";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const STUDENT_DETAIL_TAB_VALUES = {
  OVERVIEW: "overview",
  EDIT: "edit",
} as const;

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function attendanceBadgeVariant(status: string) {
  if (status === ATTENDANCE_STATUSES.ABSENT) {
    return "destructive";
  }

  if (status === ATTENDANCE_STATUSES.PRESENT) {
    return "default";
  }

  if (status === ATTENDANCE_STATUSES.EXCUSED) {
    return "outline";
  }

  return "secondary";
}

type MetricCardProps = {
  description: string;
  Icon: typeof IconUsers;
  title: string;
  value: string;
};

function MetricCard({ description, Icon, title, value }: MetricCardProps) {
  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute inset-x-0 top-0 h-[3px]"
        style={{ background: "var(--primary)" }}
      />
      <CardHeader className="gap-3">
        <CardDescription className="flex items-center gap-2">
          <span
            className="flex size-7 items-center justify-center rounded-lg"
            style={{
              background:
                "color-mix(in srgb, var(--primary) 14%, transparent)",
            }}
          >
            <Icon className="size-4" style={{ color: "var(--primary)" }} />
          </span>
          {title}
        </CardDescription>
        <CardTitle className="text-3xl font-semibold">{value}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
    </Card>
  );
}

export function StudentDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { studentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStudents = isStaffContext(session);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const studentSummaryQuery = useStudentSummaryQuery(
    managedInstitutionId,
    studentId,
  );
  const updateStudentMutation = useUpdateStudentMutation(managedInstitutionId);
  const updateError = updateStudentMutation.error as Error | null | undefined;

  const defaultValues = useMemo<StudentFormValues>(() => {
    const student = studentSummaryQuery.data?.student;

    if (!student) {
      return {
        admissionNumber: "",
        firstName: "",
        lastName: "",
        classId: "",
        sectionId: "",
        campusId: session?.activeCampus?.id ?? "",
        guardians: [],
        currentEnrollment: EMPTY_CURRENT_ENROLLMENT,
      };
    }

    return {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName ?? "",
      classId: student.classId,
      sectionId: student.sectionId,
      campusId: student.campusId,
      guardians: student.guardians.map((guardian) => ({
        name: guardian.name,
        mobile: guardian.mobile,
        email: guardian.email ?? "",
        relationship: guardian.relationship,
        isPrimary: guardian.isPrimary,
      })),
      currentEnrollment: student.currentEnrollment
        ? {
            academicYearId: student.currentEnrollment.academicYearId,
            classId: student.currentEnrollment.classId,
            sectionId: student.currentEnrollment.sectionId,
          }
        : EMPTY_CURRENT_ENROLLMENT,
    };
  }, [session?.activeCampus?.id, studentSummaryQuery.data?.student]);

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId || !studentId) {
      return;
    }

    await updateStudentMutation.mutateAsync({
      params: {
        path: {
          studentId,
        },
      },
      body: toStudentMutationBody(values),
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.STUDENT));
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage student
            records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Student management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.DASHBOARD}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (studentSummaryQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading student profile...
        </CardContent>
      </Card>
    );
  }

  if (!studentSummaryQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student not found</CardTitle>
          <CardDescription>
            The requested record could not be loaded for this institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={appendSearch(ERP_ROUTES.STUDENTS, location.search)}>
              <IconChevronLeft data-icon="inline-start" />
              Back to students
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const summary = studentSummaryQuery.data;
  const student = summary.student;
  const latestExam = summary.exams.latestTerm;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(student.fullName)}
          </div>
          <div className="space-y-1">
            <Button asChild className="-ml-3" size="sm" variant="ghost">
              <Link to={appendSearch(ERP_ROUTES.STUDENTS, location.search)}>
                <IconChevronLeft data-icon="inline-start" />
                Back to students
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold text-foreground">
                {student.fullName}
              </h2>
              <Badge
                variant={student.status === "active" ? "default" : "secondary"}
              >
                {student.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Admission {student.admissionNumber} • {student.className}{" "}
              {student.sectionName} • {student.campusName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.REPORTS_ATTENDANCE}>Attendance report</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.FEE_DUES}>Fee dues</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.EXAMS}>Exam records</Link>
          </Button>
          <Button
            onClick={() =>
              void navigate(appendSearch(ERP_ROUTES.STUDENTS, location.search))
            }
            variant="outline"
          >
            Done
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          description={`${summary.attendance.present} present out of ${summary.attendance.totalMarkedDays} marked days in the last 30 days.`}
          Icon={IconCalendarStats}
          title="Attendance"
          value={`${summary.attendance.attendancePercent}%`}
        />
        <MetricCard
          description={
            summary.fees.nextDueDate
              ? `Next due on ${formatFeeDate(summary.fees.nextDueDate)}`
              : "No outstanding dues right now."
          }
          Icon={IconCurrencyRupee}
          title="Outstanding fees"
          value={formatRupees(summary.fees.totalOutstandingInPaise)}
        />
        <MetricCard
          description={
            latestExam
              ? `${latestExam.examTermName} in ${latestExam.academicYearName}`
              : "No marks recorded yet."
          }
          Icon={IconReportAnalytics}
          title="Latest exam"
          value={latestExam ? latestExam.overallGrade : "—"}
        />
        <MetricCard
          description={
            student.guardians.length === 1
              ? "Primary guardian contact is linked to this student."
              : "Family contacts are linked to this student."
          }
          Icon={IconUsers}
          title="Linked guardians"
          value={String(student.guardians.length)}
        />
      </div>

      <Tabs defaultValue={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}>
        <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/70 p-1">
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}>
            Student 360
          </TabsTrigger>
          <TabsTrigger value={STUDENT_DETAIL_TAB_VALUES.EDIT}>
            <IconEdit className="size-4" />
            Edit student
          </TabsTrigger>
        </TabsList>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.OVERVIEW}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance snapshot</CardTitle>
                  <CardDescription>
                    Last 30 days of recorded attendance for this student.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.present}
                      </p>
                      <p className="text-sm text-muted-foreground">Present</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.absent}
                      </p>
                      <p className="text-sm text-muted-foreground">Absent</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.late}
                      </p>
                      <p className="text-sm text-muted-foreground">Late</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.attendance.absentStreak}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Current absent streak
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium">Recent records</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(summary.attendance.startDate)} to{" "}
                        {formatDate(summary.attendance.endDate)}
                      </p>
                    </div>
                    {summary.attendance.recentRecords.length > 0 ? (
                      <div className="space-y-2">
                        {summary.attendance.recentRecords.map((record) => (
                          <div
                            key={`${record.date}-${record.status}`}
                            className="flex items-center justify-between rounded-xl border px-4 py-3"
                          >
                            <div>
                              <p className="text-sm font-medium">
                                {formatDate(record.date)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Attendance entry
                              </p>
                            </div>
                            <Badge variant={attendanceBadgeVariant(record.status)}>
                              {
                                ATTENDANCE_STATUS_LABELS[
                                  record.status as keyof typeof ATTENDANCE_STATUS_LABELS
                                ]
                              }
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No attendance has been marked for this student yet.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fees snapshot</CardTitle>
                  <CardDescription>
                    Outstanding dues, recent assignments, and latest payments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {formatRupees(summary.fees.totalOutstandingInPaise)}
                      </p>
                      <p className="text-sm text-muted-foreground">Outstanding</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {formatRupees(summary.fees.totalPaidInPaise)}
                      </p>
                      <p className="text-sm text-muted-foreground">Collected</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.fees.overdueCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Overdue items</p>
                    </div>
                    <div className="rounded-xl border bg-muted/30 p-4">
                      <p className="text-2xl font-semibold">
                        {summary.fees.paymentCount}
                      </p>
                      <p className="text-sm text-muted-foreground">Payments</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Open assignments</p>
                      {summary.fees.recentAssignments.length > 0 ? (
                        summary.fees.recentAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="rounded-xl border px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {assignment.feeStructureName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {assignment.installmentLabel
                                    ? `${assignment.installmentLabel} • `
                                    : ""}
                                  Due {formatFeeDate(assignment.dueDate)}
                                </p>
                              </div>
                              <Badge variant="secondary">{assignment.status}</Badge>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                              <span>
                                Assigned {formatRupees(assignment.assignedAmountInPaise)}
                              </span>
                              <span>
                                Paid {formatRupees(assignment.paidAmountInPaise)}
                              </span>
                              <span>
                                Due{" "}
                                {formatRupees(assignment.outstandingAmountInPaise)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No fee assignments are visible for this student.
                        </p>
                      )}
                    </div>

                    <div className="space-y-3">
                      <p className="text-sm font-medium">Recent payments</p>
                      {summary.fees.recentPayments.length > 0 ? (
                        summary.fees.recentPayments.map((payment) => (
                          <div
                            key={payment.id}
                            className="rounded-xl border px-4 py-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium">
                                  {formatRupees(payment.amountInPaise)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFeeDate(payment.paymentDate)} •{" "}
                                  {payment.paymentMethod.replaceAll("_", " ")}
                                </p>
                              </div>
                              <IconReceipt className="size-4 text-muted-foreground" />
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          No payments have been collected for this student yet.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Exam snapshot</CardTitle>
                  <CardDescription>
                    Latest overall performance and recent exam terms.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {latestExam ? (
                    <div className="rounded-2xl border bg-muted/25 p-5">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold">
                            {latestExam.examTermName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {latestExam.academicYearName} • Closed on{" "}
                            {formatDate(latestExam.endDate)}
                          </p>
                        </div>
                        <Badge variant="default">
                          Grade {latestExam.overallGrade}
                        </Badge>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-3">
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.overallPercent}%
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Overall percent
                          </p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.totalObtainedMarks}/
                            {latestExam.totalMaxMarks}
                          </p>
                          <p className="text-sm text-muted-foreground">Marks</p>
                        </div>
                        <div className="rounded-xl border bg-background p-4">
                          <p className="text-2xl font-semibold">
                            {latestExam.subjectCount}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Subjects
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No exam marks have been recorded for this student yet.
                    </p>
                  )}

                  {summary.exams.recentTerms.length > 1 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-medium">Recent terms</p>
                      {summary.exams.recentTerms.slice(1).map((term) => (
                        <div
                          key={term.examTermId}
                          className="flex items-center justify-between rounded-xl border px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              {term.examTermName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {term.academicYearName} • {formatDate(term.endDate)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {term.overallPercent}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Grade {term.overallGrade}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            </div>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile snapshot</CardTitle>
                  <CardDescription>
                    Current placement and identity details for daily operations.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div>
                    <p className="text-sm font-medium">{student.campusName}</p>
                    <p className="text-xs text-muted-foreground">Campus</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {student.className} {student.sectionName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current class and section
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {student.currentEnrollment?.academicYearName ??
                        "Not assigned"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Current academic year
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium">
                      {student.admissionNumber}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Admission number
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Linked guardians</CardTitle>
                  <CardDescription>
                    Guardians available for outreach and student follow-up.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.guardians.map((guardian) => (
                    <div key={guardian.membershipId} className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{guardian.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {guardian.mobile}
                            {guardian.email ? ` • ${guardian.email}` : ""}
                          </p>
                        </div>
                        <Badge
                          variant={guardian.isPrimary ? "default" : "outline"}
                        >
                          {guardian.isPrimary ? "Primary" : guardian.relationship}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Latest activity</CardTitle>
                  <CardDescription>
                    A quick timeline across profile, attendance, fees, and exam
                    events.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {summary.timeline.length > 0 ? (
                    summary.timeline.map((event, index) => (
                      <div key={`${event.type}-${event.occurredAt}-${index}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                            {event.type === "fee_payment" ? (
                              <IconCurrencyRupee className="size-4" />
                            ) : event.type === "attendance" ? (
                              <IconCalendarStats className="size-4" />
                            ) : event.type === "exam" ? (
                              <IconSchool className="size-4" />
                            ) : event.type === "guardian" ? (
                              <IconUsers className="size-4" />
                            ) : (
                              <IconTimeline className="size-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <p className="text-sm font-medium">
                                {event.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatDateTime(event.occurredAt)}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {event.description}
                            </p>
                          </div>
                        </div>
                        {index < summary.timeline.length - 1 ? (
                          <Separator className="mt-4" />
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No recent activity is available for this student yet.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          className="mt-6 flex flex-col gap-6"
          value={STUDENT_DETAIL_TAB_VALUES.EDIT}
        >
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Edit student</CardTitle>
                <CardDescription>
                  Update the student profile, campus assignment, and linked
                  guardians.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StudentForm
                  academicYears={academicYearsQuery.data?.rows ?? []}
                  campuses={campuses}
                  defaultValues={defaultValues}
                  errorMessage={updateError?.message}
                  isPending={updateStudentMutation.isPending}
                  onSubmit={onSubmit}
                  submitLabel="Save changes"
                />
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current enrollment</CardTitle>
                  <CardDescription>
                    Backend-owned placement for the active academic year, class,
                    and section.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.currentEnrollment ? (
                    <>
                      <div>
                        <p className="text-sm font-medium">
                          {student.currentEnrollment.academicYearName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Academic year
                        </p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">
                          {student.currentEnrollment.className}
                        </p>
                        <p className="text-xs text-muted-foreground">Class</p>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium">
                          {student.currentEnrollment.sectionName}
                        </p>
                        <p className="text-xs text-muted-foreground">Section</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No current enrollment assigned yet.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Linked guardians</CardTitle>
                  <CardDescription>
                    Current guardian contacts available to the student record.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {student.guardians.map((guardian, index) => (
                    <div key={guardian.membershipId} className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">{guardian.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {guardian.mobile}
                            {guardian.email ? ` • ${guardian.email}` : ""}
                          </p>
                        </div>
                        <Badge
                          variant={guardian.isPrimary ? "default" : "outline"}
                        >
                          {guardian.isPrimary
                            ? "Primary"
                            : guardian.relationship}
                        </Badge>
                      </div>
                      {index < student.guardians.length - 1 ? (
                        <Separator />
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
