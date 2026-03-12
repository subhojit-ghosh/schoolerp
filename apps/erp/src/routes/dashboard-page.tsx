import {
  IconArrowRight,
  IconBook2,
  IconCalendarStats,
  IconCurrencyRupee,
  IconUsers,
} from "@tabler/icons-react";
import { Link } from "react-router-dom";
import { SectionCards } from "@/components/section-cards";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";

const QUICK_ACTIONS = [
  {
    label: "Students",
    description: "View and manage student records",
    href: ERP_ROUTES.STUDENTS,
    Icon: IconUsers,
  },
  {
    label: "Academic Years",
    description: "Manage current and archived sessions",
    href: ERP_ROUTES.ACADEMIC_YEARS,
    Icon: IconBook2,
  },
  {
    label: "Attendance",
    description: "Daily attendance tracking",
    href: "#",
    Icon: IconCalendarStats,
  },
  {
    label: "Fees",
    description: "Billing, collections and dues",
    href: "#",
    Icon: IconCurrencyRupee,
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
      <SectionCards />

      {/* Quick actions */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 px-0.5">
          Quick access
        </p>
        <div className="grid grid-cols-1 gap-3 @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
          {QUICK_ACTIONS.map(({ label, description, href, Icon }) => (
            <Link
              key={label}
              to={href}
              className="group flex items-center gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/30 hover:bg-primary/[0.03] hover:shadow-sm"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:bg-primary/10"
                style={{ background: "var(--primary, #8a5a44)1a" }}
              >
                <Icon className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{description}</p>
              </div>
              <IconArrowRight className="size-4 text-muted-foreground/40 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
