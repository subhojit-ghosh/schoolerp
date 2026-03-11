import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants";
import { PageShell } from "@/components/page-shell";
import { getPlatformSessionUser } from "@/server/auth/require-platform-super-admin";
import { countInstitutionsByStatus } from "@/server/institutions/queries";

export default async function AdminDashboardPage() {
  const [user, counts] = await Promise.all([
    getPlatformSessionUser(),
    countInstitutionsByStatus(),
  ]);

  return (
    <PageShell
      label="Platform control"
      title="Institution oversight"
      meta={`${counts.total} institutions`}
      actions={
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION}>
          <Button size="sm" className="rounded-xl">
            <Plus className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="rounded-3xl border-border/60">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-cap text-[0.6875rem] uppercase tracking-[0.15em] text-muted-foreground">
                  Total institutions
                </CardTitle>
                <Building2 className="text-muted-foreground size-4" />
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold tracking-tight">
                  {counts.total}
                </p>
                <p className="text-sm text-muted-foreground">+4 this month</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/60 bg-primary text-primary-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-cap text-[0.6875rem] uppercase tracking-[0.15em] text-primary-foreground/70">
                  Active
                </CardTitle>
                <CheckCircle2 className="size-4 text-primary-foreground/80" />
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold tracking-tight">
                  {counts.active}
                </p>
                <p className="text-sm text-primary-foreground/70">Stable</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-amber-200/70 bg-amber-50/80">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="font-cap text-[0.6875rem] uppercase tracking-[0.15em] text-amber-700/80">
                  Suspended
                </CardTitle>
                <AlertTriangle className="size-4 text-amber-600" />
              </CardHeader>
              <CardContent className="flex items-end justify-between gap-3">
                <p className="text-4xl font-semibold tracking-tight text-amber-900">
                  {counts.suspended}
                </p>
                <p className="text-sm text-amber-700/80">Review</p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-3xl border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Institution health
              </CardTitle>
              <p className="text-sm text-muted-foreground">12 min ago</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                {
                  title: "National Institute of Technology",
                  subtitle: "Billing reconciliation overdue",
                  tone:
                    "bg-amber-100/80 text-amber-800 border border-amber-200/60",
                  value: "Needs action",
                },
                {
                  title: "Greenwood International School",
                  subtitle: "Admin invited, awaiting 2FA",
                  tone:
                    "bg-muted text-muted-foreground border border-border/60",
                  value: "Pending",
                },
                {
                  title: "Sunrise Primary Academy",
                  subtitle: "Attendance sync healthy",
                  tone:
                    "bg-emerald-100/70 text-emerald-800 border border-emerald-200/60",
                  value: "Stable",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-2xl bg-muted/40 px-4 py-3"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${item.tone}`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card className="rounded-3xl border-border/60 bg-primary text-primary-foreground">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                System pulse
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Attendance jobs", value: 98 },
                { label: "Fee cycles", value: 91 },
                { label: "Report generation", value: 87 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary-foreground/80">
                      {item.label}
                    </span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-primary-foreground/15">
                    <div
                      className="h-2 rounded-full bg-primary-foreground/80"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-border/60">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">
                Fast actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Invite institution admin",
                "Review suspended campus",
                "Open compliance snapshot",
              ].map((item) => (
                <button
                  key={item}
                  className="flex w-full items-center justify-between rounded-2xl bg-muted/40 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60"
                  type="button"
                >
                  <span>{item}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}
