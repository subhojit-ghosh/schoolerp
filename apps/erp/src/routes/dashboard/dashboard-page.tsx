import { useCallback, useMemo, useState } from "react";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  IconAlertTriangle,
  IconArrowRight,
  IconBook2,
  IconCalendarStats,
  IconCertificate,
  IconCurrencyRupee,
  IconRocket,
  IconTrendingDown,
  IconTrendingUp,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { EntityPageShell } from "@/components/entities/entity-page-shell";
import { SectionCards } from "@/components/data-display/section-cards";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { ERP_ROUTES } from "@/constants/routes";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useStudentsQuery } from "@/features/students/api/use-students";
import { useStaffQuery } from "@/features/staff/api/use-staff";
import { useAttendanceOverviewQuery } from "@/features/attendance/api/use-attendance";
import { useCollectionSummaryQuery } from "@/features/fees/api/use-fees";
import { formatRupees } from "@/features/fees/model/fee-formatters";
import { formatDateTime, formatFullDate } from "@/lib/format";
import { getLastLogin } from "@/lib/last-login";
import { FamilyPortalPage } from "@/features/family/ui/family-portal-page";
import { StudentPortalPage } from "@/features/student-portal/ui/student-portal-page";
import { useSetupStatusQuery } from "@/features/setup/api/use-setup-status";
import { SetupChecklist } from "@/features/setup/ui/setup-checklist";
import {
  useNeedsAttentionQuery,
  useTrendsQuery,
  useDismissItemMutation,
} from "@/features/dashboard/api/use-dashboard";

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

const TODAY_DATE = new Date();
const TODAY = TODAY_DATE.toISOString().slice(0, 10);
const TODAY_DISPLAY = formatFullDate(TODAY_DATE);
const DASHBOARD_STAFF_LIMIT = 1;

export function DashboardPage() {
  useDocumentTitle("Dashboard");
  const lastLoginDisplay = useMemo(() => {
    const stored = getLastLogin();
    return stored ? formatDateTime(stored) : null;
  }, []);
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const name = session?.user.name ?? "";
  const institutionId = session?.activeOrganization?.id;
  const staffDashboardInstitutionId = isStaffContext(session)
    ? institutionId
    : undefined;
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
  const academicYearsQuery = useAcademicYearsQuery(
    staffDashboardInstitutionId,
    { limit: 1 },
  );
  const needsSetup =
    isStaffContext(session) &&
    !academicYearsQuery.isLoading &&
    (academicYearsQuery.data?.total ?? 0) === 0;

  const CHECKLIST_DISMISSED_KEY = "setup-checklist-dismissed";
  const [checklistDismissed, setChecklistDismissed] = useState(
    () => localStorage.getItem(CHECKLIST_DISMISSED_KEY) === "true",
  );
  const setupStatusQuery = useSetupStatusQuery(
    isStaffContext(session) && !needsSetup && !checklistDismissed,
  );
  const handleDismissChecklist = useCallback(() => {
    localStorage.setItem(CHECKLIST_DISMISSED_KEY, "true");
    setChecklistDismissed(true);
  }, []);

  const attendanceOverview = attendanceOverviewQuery.data ?? [];
  const markedSections = attendanceOverview.filter(
    (item) => item.marked,
  ).length;
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
    totalSections === 0
      ? "0/0 sections"
      : `${markedSections}/${totalSections} sections`;
  const attendanceBadge =
    totalSections === 0
      ? "No class sections"
      : `P ${presentCount} | A ${absentCount}`;
  const outstandingFeesValue = formatRupees(
    collectionSummaryQuery.data?.totalOutstandingInPaise ?? 0,
  );

  if (activeContext?.key === AUTH_CONTEXT_KEYS.PARENT) {
    return <FamilyPortalPage view="overview" />;
  }

  if (activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT) {
    return <StudentPortalPage view="overview" />;
  }

  return (
    <EntityPageShell width="full">
      {/* Setup banner */}
      {needsSetup ? (
        <div
          className="flex items-center justify-between gap-4 rounded-xl border p-4"
          style={{
            background: "color-mix(in srgb, var(--primary) 6%, transparent)",
            borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                background:
                  "color-mix(in srgb, var(--primary) 15%, transparent)",
              }}
            >
              <IconRocket
                className="size-4"
                style={{ color: "var(--primary)" }}
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">
                Complete your school setup
              </p>
              <p className="text-xs text-muted-foreground">
                Create an academic year and your first class to unlock
                attendance, fees, and exams.
              </p>
            </div>
          </div>
          <Button
            asChild
            className="shrink-0 h-9 rounded-lg px-4"
            style={{ background: "var(--primary)" }}
          >
            <Link to={ERP_ROUTES.SETUP}>Get started</Link>
          </Button>
        </div>
      ) : null}

      {/* Setup checklist */}
      {!checklistDismissed && setupStatusQuery.data ? (
        <SetupChecklist
          status={setupStatusQuery.data}
          onDismiss={handleDismissChecklist}
        />
      ) : null}

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
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          <span>{TODAY_DISPLAY}</span>
          {lastLoginDisplay ? (
            <>
              <span aria-hidden="true" className="hidden sm:inline">
                &middot;
              </span>
              <span className="text-xs">Last login: {lastLoginDisplay}</span>
            </>
          ) : null}
        </div>
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
      {/* Needs attention */}
      <NeedsAttentionSection enabled={Boolean(staffDashboardInstitutionId)} />

      {/* Trend indicators */}
      <TrendsSection enabled={Boolean(staffDashboardInstitutionId)} />

      {/* Role-specific insights */}
      <RoleInsights session={session} />
    </EntityPageShell>
  );
}

// ── Needs Attention ─────────────────────────────────────────────────────────

type AttentionItem = {
  id: string;
  title: string;
  description?: string;
  severity?: "low" | "medium" | "high";
  actionUrl?: string;
  actionLabel?: string;
};

function NeedsAttentionSection({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useNeedsAttentionQuery(enabled);
  const dismissMutation = useDismissItemMutation();

  const items: AttentionItem[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as AttentionItem[];
    const result = data as { items?: AttentionItem[] };
    return result.items ?? [];
  }, [data]);

  const handleDismiss = useCallback(
    (itemId: string) => {
      dismissMutation.mutate(
        { params: { path: { itemId } } },
        {
          onSuccess: () => {
            toast.success("Item dismissed");
          },
          onError: (error: unknown) => {
            toast.error(
              error instanceof Error ? error.message : "Failed to dismiss item",
            );
          },
        },
      );
    },
    [dismissMutation],
  );

  if (!enabled || isLoading || items.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
        Needs attention
      </p>
      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
        {items.map((item) => (
          <Card
            key={item.id}
            className="relative overflow-hidden"
          >
            {item.severity === "high" ? (
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: "var(--destructive, #ef4444)" }}
              />
            ) : item.severity === "medium" ? (
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: "#f59e0b" }}
              />
            ) : null}
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <IconAlertTriangle
                    className="size-4 shrink-0"
                    style={{
                      color:
                        item.severity === "high"
                          ? "var(--destructive, #ef4444)"
                          : item.severity === "medium"
                            ? "#f59e0b"
                            : "var(--muted-foreground)",
                    }}
                  />
                  <CardTitle className="text-sm">{item.title}</CardTitle>
                </div>
                <Button
                  className="h-6 w-6 shrink-0 rounded-md"
                  disabled={dismissMutation.isPending}
                  onClick={() => handleDismiss(item.id)}
                  size="icon"
                  type="button"
                  variant="ghost"
                >
                  <IconX className="size-3.5" />
                </Button>
              </div>
              {item.description ? (
                <CardDescription className="text-xs">
                  {item.description}
                </CardDescription>
              ) : null}
            </CardHeader>
            {item.actionUrl ? (
              <CardContent className="pt-0 pb-3">
                <Button
                  asChild
                  className="h-8 rounded-md text-xs"
                  size="sm"
                  variant="outline"
                >
                  <Link to={item.actionUrl}>
                    {item.actionLabel ?? "View details"}
                    <IconArrowRight className="ml-1 size-3" />
                  </Link>
                </Button>
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}

// ── Trends ──────────────────────────────────────────────────────────────────

type TrendItem = {
  label: string;
  current: number;
  previous: number;
  unit: string;
};

function TrendsSection({ enabled }: { enabled: boolean }) {
  const { data, isLoading } = useTrendsQuery(enabled);

  const trends: TrendItem[] = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as TrendItem[];
    const result = data as { trends?: TrendItem[] };
    return result.trends ?? [];
  }, [data]);

  if (!enabled || isLoading || trends.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
        Trends
      </p>
      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
        {trends.map((trend) => {
          const change =
            trend.previous !== 0
              ? Math.round(
                  ((trend.current - trend.previous) / trend.previous) * 100,
                )
              : 0;
          const isPositive = change > 0;
          const isNegative = change < 0;
          return (
            <Card key={trend.label} className="@container/card">
              <CardHeader className="pb-1">
                <CardDescription className="text-xs">
                  {trend.label}
                </CardDescription>
                <CardTitle className="text-xl font-bold tabular-nums">
                  {trend.current} {trend.unit}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1">
                  {isPositive ? (
                    <IconTrendingUp className="size-3.5 text-green-600" />
                  ) : isNegative ? (
                    <IconTrendingDown className="size-3.5 text-red-500" />
                  ) : null}
                  {change !== 0 ? (
                    <span
                      className={`text-xs font-medium ${
                        isPositive
                          ? "text-green-600"
                          : isNegative
                            ? "text-red-500"
                            : "text-muted-foreground"
                      }`}
                    >
                      {isPositive ? "+" : ""}
                      {change}%
                    </span>
                  ) : null}
                  <span className="text-xs text-muted-foreground">
                    vs previous: {trend.previous}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// ── Role Insights ───────────────────────────────────────────────────────────

function RoleInsights({
  session,
}: {
  session: ReturnType<typeof useAuthStore.getState>["session"];
}) {
  const roles = session?.activeStaffRoles ?? [];
  const roleNames = roles.map((r: { name: string }) => r.name);

  const isAdmin = roleNames.some(
    (n: string) =>
      n.toLowerCase().includes("admin") ||
      n.toLowerCase().includes("principal"),
  );
  const isAccountant = roleNames.some(
    (n: string) =>
      n.toLowerCase().includes("accountant") ||
      n.toLowerCase().includes("finance"),
  );
  const isTeacher = roleNames.some(
    (n: string) =>
      n.toLowerCase().includes("teacher") ||
      n.toLowerCase().includes("class teacher"),
  );

  if (!isAdmin && !isAccountant && !isTeacher) return null;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
        For you
      </p>
      <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-3">
        {isAdmin ? (
          <>
            <InsightCard
              title="Staff-Student Ratio"
              description="Monitor staffing levels across the institution"
              href={ERP_ROUTES.REPORTS_STUDENT_STRENGTH}
            />
            <InsightCard
              title="Fee Defaulters"
              description="Students with overdue fee payments"
              href={ERP_ROUTES.FEE_DEFAULTERS}
            />
            <InsightCard
              title="Audit Trail"
              description="Review recent changes across the system"
              href={ERP_ROUTES.SETTINGS_AUDIT}
            />
          </>
        ) : null}
        {isAccountant ? (
          <>
            <InsightCard
              title="Fee Collection"
              description="Today's collection and outstanding summary"
              href={ERP_ROUTES.FEE_REPORTS}
            />
            <InsightCard
              title="Fee Defaulters"
              description="Follow up on overdue payments"
              href={ERP_ROUTES.FEE_DEFAULTERS}
            />
            <InsightCard
              title="Payroll Runs"
              description="Process and manage monthly payroll"
              href={ERP_ROUTES.PAYROLL_RUNS}
            />
          </>
        ) : null}
        {isTeacher ? (
          <>
            <InsightCard
              title="My Attendance"
              description="Mark today's class attendance"
              href={ERP_ROUTES.ATTENDANCE}
            />
            <InsightCard
              title="Homework"
              description="Assign and track homework"
              href={ERP_ROUTES.HOMEWORK}
            />
            <InsightCard
              title="PTM Sessions"
              description="Upcoming parent-teacher meetings"
              href={ERP_ROUTES.PTM_SESSIONS}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

function InsightCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      to={href}
      className="group rounded-xl border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md"
    >
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </Link>
  );
}
