import { CalendarDays, CreditCard, GraduationCap, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSignOutMutation } from "@/features/auth/api/use-auth";
import { useAuthStore } from "@/features/auth/model/auth-store";

const DASHBOARD_METRICS = [
  { icon: Users, label: "Students", value: "1,248" },
  { icon: GraduationCap, label: "Staff", value: "84" },
  { icon: CalendarDays, label: "Attendance", value: "94.6%" },
  { icon: CreditCard, label: "Fee Collection", value: "82%" },
] as const;

export function DashboardPage() {
  const authSession = useAuthStore((store) => store.session);
  const signOutMutation = useSignOutMutation();

  return (
    <div className="grid gap-6">
      <Card>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Workspace Shell</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">One layout shared across all institutions.</h2>
            {authSession ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Signed in as {authSession.user.name} ({authSession.user.mobile})
              </p>
            ) : null}
          </div>
          <div className="flex max-w-xl flex-col gap-3 text-sm leading-6 text-muted-foreground sm:items-end">
            <p>
              Institutions should feel branded, not bespoke. The same structure drives students, staff, fees, and
              attendance while theme tokens handle school-specific identity.
            </p>
            <Button onClick={() => signOutMutation.mutate({})} type="button" variant="outline">
              Sign out
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_METRICS.map((metric) => (
          <Card className="space-y-3" key={metric.label}>
            <metric.icon className="size-5 text-[var(--primary)]" />
            <div>
              <p className="text-sm text-muted-foreground">{metric.label}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight">{metric.value}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
