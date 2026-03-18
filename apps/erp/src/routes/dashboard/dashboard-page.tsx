import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  IconArrowRight,
  IconBook2,
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconMoodKid,
  IconUsers,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { SectionCards } from "@/components/data-display/section-cards";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";
import { useStudentsQuery } from "@/features/students/api/use-students";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import { useAttendanceOverviewQuery } from "@/features/attendance/api/use-attendance";
import { useCollectionSummaryQuery } from "@/features/fees/api/use-fees";
import { formatRupees } from "@/features/fees/model/fee-formatters";

const QUICK_ACTIONS = [
  {
    label: "Students",
    description: "Manage student records",
    href: ERP_ROUTES.STUDENTS,
    Icon: IconUsers,
    disabled: false,
  },
  {
    label: "Academic Years",
    description: "Review active and archived years",
    href: ERP_ROUTES.ACADEMIC_YEARS,
    Icon: IconBook2,
    disabled: false,
  },
  {
    label: "Exams",
    description: "Create exam terms and marks",
    href: ERP_ROUTES.EXAMS,
    Icon: IconCertificate,
    disabled: false,
  },
  {
    label: "Attendance",
    description: "Track daily attendance",
    href: ERP_ROUTES.ATTENDANCE,
    Icon: IconCalendarStats,
    disabled: false,
  },
  {
    label: "Fees",
    description: "Collect fees and track dues",
    href: ERP_ROUTES.FEES,
    Icon: IconCurrencyRupee,
    disabled: false,
  },
] as const;

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(name: string) {
  return name.split(" ")[0] ?? name;
}

const TODAY = new Date().toISOString().slice(0, 10);
const DASHBOARD_STAFF_LIMIT = 1;

export function DashboardPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const name = session?.user.name ?? "";
  const institutionId = session?.activeOrganization?.id;
  const staffDashboardInstitutionId = isStaffContext(session)
    ? institutionId
    : undefined;
  const linkedStudents = session?.linkedStudents ?? [];
  const studentsQuery = useStudentsQuery(staffDashboardInstitutionId);
  const studentCount = studentsQuery.data?.total ?? 0;
  const staffQuery = useStaffQuery(staffDashboardInstitutionId, {
    page: 1,
    limit: DASHBOARD_STAFF_LIMIT,
  });
  const staffCount = staffQuery.data?.total ?? 0;
  const attendanceOverviewQuery = useAttendanceOverviewQuery(
    staffDashboardInstitutionId,
    {
      date: TODAY,
    },
  );
  const collectionSummaryQuery = useCollectionSummaryQuery(
    Boolean(staffDashboardInstitutionId),
  );
  const attendanceOverview = attendanceOverviewQuery.data ?? [];
  const markedSections = attendanceOverview.filter((item) => item.marked).length;
  const totalSections = attendanceOverview.length;
  const presentCount = attendanceOverview.reduce(
    (sum, item) => sum + (item.counts?.present ?? 0),
    0,
  );
  const absentCount = attendanceOverview.reduce(
    (sum, item) => sum + (item.counts?.absent ?? 0),
    0,
  );
  const todayAttendanceValue =
    totalSections === 0 ? "0/0 sections" : `${markedSections}/${totalSections} sections`;
  const attendanceBadge =
    totalSections === 0
      ? "No class sections"
      : `P ${presentCount} | A ${absentCount}`;
  const outstandingFeesValue = formatRupees(
    collectionSummaryQuery.data?.totalOutstandingInPaise ?? 0,
  );

  if (activeContext?.key === AUTH_CONTEXT_KEYS.PARENT) {
    return (
      <div className="flex flex-col gap-6">
        <div className="px-0.5">
          <div className="mb-1.5 flex items-center gap-2">
            <div
              className="h-0.5 w-5 rounded-full"
              style={{ background: "var(--primary)" }}
            />
            <Badge variant="secondary">Parent view</Badge>
          </div>
          <h2
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {getGreeting()}, {firstName(name)}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View linked students and family updates.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {linkedStudents.map((student) => (
            <Card
              key={student.studentId}
              className="overflow-hidden border-primary/15 bg-card"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">
                      {student.fullName}
                    </CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {student.campusName}
                    </p>
                  </div>
                  <div
                    className="flex size-11 items-center justify-center rounded-2xl"
                    style={{
                      background:
                        "color-mix(in srgb, var(--primary) 14%, transparent)",
                    }}
                  >
                    <IconMoodKid
                      className="size-5"
                      style={{ color: "var(--primary)" }}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="font-mono">
                    {student.admissionNumber}
                  </Badge>
                  {student.relationship ? (
                    <Badge className="capitalize" variant="secondary">
                      {student.relationship}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground">
                  Parent tools for this student will appear here.
                </p>
              </CardContent>
            </Card>
          ))}
          {linkedStudents.length === 0 ? (
            <Card className="border-dashed bg-muted/25 md:col-span-2 xl:col-span-3">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                No linked students are visible in this tenant yet.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    );
  }

  if (activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Student view</Badge>
            <CardTitle>Student dashboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Student tools will appear here.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="px-0.5">
        <div className="mb-1.5 flex items-center gap-2">
          <div
            className="h-0.5 w-5 rounded-full"
            style={{ background: "var(--primary)" }}
          />
        </div>
        <h2
          className="text-3xl font-bold text-foreground"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          {getGreeting()}, {firstName(name)}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening today.
        </p>
      </div>

      {/* Stat cards */}
      <SectionCards
        attendanceBadge={attendanceBadge}
        isLoadingAttendance={attendanceOverviewQuery.isLoading}
        isLoadingFees={collectionSummaryQuery.isLoading}
        isLoadingStaff={staffQuery.isLoading}
        isLoadingStudents={studentsQuery.isLoading}
        outstandingFeesValue={outstandingFeesValue}
        staffCount={staffCount}
        studentCount={studentCount}
        todayAttendanceValue={todayAttendanceValue}
      />

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
          Quick access
        </p>
        <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
          {QUICK_ACTIONS.map(({ label, description, href, Icon, disabled }) =>
            disabled ? (
              <div
                key={label}
                aria-disabled="true"
                className="flex items-center gap-4 rounded-xl border border-dashed bg-card/40 p-4"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                  <Icon className="size-5 text-muted-foreground/50" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      {label}
                    </p>
                    <Badge variant="outline" className="text-[10px]">
                      Coming soon
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {description}
                  </p>
                </div>
              </div>
            ) : (
              <Link
                key={label}
                to={href}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition-all group-hover:scale-105"
                  style={{
                    background:
                      "color-mix(in srgb, var(--primary) 10%, transparent)",
                    border:
                      "1px solid color-mix(in srgb, var(--primary) 15%, transparent)",
                  }}
                >
                  <Icon
                    className="size-5"
                    style={{ color: "var(--primary)" }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">
                    {label}
                  </p>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <IconArrowRight
                  className="size-4 text-muted-foreground/40 transition-all group-hover:translate-x-1 shrink-0"
                  style={{
                    color:
                      "color-mix(in srgb, var(--primary) 60%, transparent)",
                  }}
                />
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
