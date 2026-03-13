import {
  IconArrowRight,
  IconBook2,
  IconCalendarStats,
  IconCurrencyRupee,
  IconClockHour4,
  IconUsers,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { Badge } from "@repo/ui/components/ui/badge";
import { SectionCards } from "@/components/section-cards";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";
import { useStudentsQuery } from "@/features/students/api/use-students";

const QUICK_ACTIONS = [
  {
    label: "Students",
    description: "View and manage student records",
    href: ERP_ROUTES.STUDENTS,
    Icon: IconUsers,
    disabled: false,
  },
  {
    label: "Academic Years",
    description: "Manage current and archived sessions",
    href: ERP_ROUTES.ACADEMIC_YEARS,
    Icon: IconBook2,
    disabled: false,
  },
  {
    label: "Attendance",
    description: "Attendance workflows are queued after the current student slice.",
    href: ERP_ROUTES.DASHBOARD,
    Icon: IconCalendarStats,
    disabled: true,
  },
  {
    label: "Fees",
    description: "Finance surfaces are intentionally hidden until backend modules exist.",
    href: ERP_ROUTES.DASHBOARD,
    Icon: IconCurrencyRupee,
    disabled: true,
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

export function DashboardPage() {
  const session = useAuthStore((store) => store.session);
  const name = session?.user.name ?? "";
  const institutionId = session?.activeOrganization?.id;
  const studentsQuery = useStudentsQuery(institutionId);
  const studentCount = studentsQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Greeting */}
      <div className="px-0.5">
        <h2 className="text-xl font-semibold text-foreground">
          {getGreeting()}, {firstName(name)}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Here's what's happening at your school today.
        </p>
      </div>

      {/* Stat cards */}
      <SectionCards
        isLoadingStudents={studentsQuery.isLoading}
        session={session}
        studentCount={studentCount}
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
                className="flex items-center gap-4 rounded-xl border border-dashed bg-card/70 p-4"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted"
                >
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <Badge variant="outline">Coming soon</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{description}</p>
                </div>
                <IconClockHour4 className="size-4 text-muted-foreground/50 shrink-0" />
              </div>
            ) : (
              <Link
                key={label}
                to={href}
                className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
              >
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/10"
                  style={{ background: "color-mix(in srgb, var(--primary, #8a5a44) 12%, white)" }}
                >
                  <Icon className="size-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{description}</p>
                </div>
                <IconArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground shrink-0" />
              </Link>
            ),
          )}
        </div>
      </div>
    </div>
  );
}
