"use client";

import { ShieldCheck, Activity, Building2 } from "lucide-react";
import { ModeToggle } from "@/components/theme/mode-toggle";

type PlatformAuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

const AUTH_SIGNAL_ITEMS = [
  {
    icon: ShieldCheck,
    label: "Protected access",
    value: "2-step verification enabled",
  },
  {
    icon: Building2,
    label: "Institution control",
    value: "Provision campuses and admins",
  },
  {
    icon: Activity,
    label: "Platform health",
    value: "Monitor workflows and system pulse",
  },
] as const;

export function PlatformAuthShell({
  eyebrow,
  title,
  description,
  children,
}: PlatformAuthShellProps) {
  return (
    <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.4),transparent_32%),linear-gradient(180deg,#e8e0d3_0%,#efe7db_100%)] px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex min-h-[calc(100svh-2rem)] w-full max-w-[1480px] flex-col rounded-[36px] border border-border/60 bg-[rgba(255,250,243,0.74)] shadow-[0_30px_90px_-52px_rgba(15,45,53,0.55)] backdrop-blur-sm md:min-h-[calc(100svh-3rem)] lg:flex-row lg:overflow-hidden">
        <section className="relative flex flex-col justify-between overflow-hidden rounded-[32px] bg-[linear-gradient(160deg,#143640_0%,#0f2d35_55%,#0a252d_100%)] p-6 text-primary-foreground md:p-8 lg:w-[440px] lg:rounded-none">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,197,124,0.18),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_28%)]" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-sm font-semibold text-[#ebcf93]">
                E
              </div>
              <div>
                <p className="text-2xl font-semibold tracking-tight">EduERP</p>
                <p className="text-[0.68rem] uppercase tracking-[0.24em] text-primary-foreground/55">
                  Platform control plane
                </p>
              </div>
            </div>
            <ModeToggle />
          </div>

          <div className="relative mt-10 space-y-4 lg:mt-0">
            <p className="text-[0.72rem] uppercase tracking-[0.26em] text-[#ebcf93]">
              Platform admin
            </p>
            <h1 className="max-w-sm text-4xl leading-tight font-semibold tracking-tight text-primary-foreground">
              Enterprise control for every institution you run.
            </h1>
            <p className="max-w-md text-sm leading-6 text-primary-foreground/68">
              Compact, secure access to onboarding, governance, and system-wide
              operations from one workspace.
            </p>
          </div>

          <div className="relative mt-10 space-y-3">
            {AUTH_SIGNAL_ITEMS.map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/6 px-4 py-3"
              >
                <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/8 text-[#ebcf93]">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[0.68rem] uppercase tracking-[0.18em] text-primary-foreground/52">
                    {label}
                  </p>
                  <p className="truncate text-sm text-primary-foreground">
                    {value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-1 items-center justify-center p-4 md:p-8 lg:p-12">
          <div className="w-full max-w-[460px] rounded-[32px] border border-border/60 bg-card/96 p-6 shadow-[0_24px_70px_-52px_rgba(15,45,53,0.55)] md:p-8">
            <div className="space-y-3">
              <p className="text-[0.68rem] uppercase tracking-[0.22em] text-muted-foreground">
                {eyebrow}
              </p>
              <h2 className="text-3xl leading-tight font-semibold tracking-tight text-foreground">
                {title}
              </h2>
              <p className="max-w-sm text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </div>

            <div className="mt-8">{children}</div>
          </div>
        </section>
      </div>
    </div>
  );
}
