"use client";

type PlatformAuthShellProps = {
  eyebrow?: string;
  title: string;
  description: string;
  heroLabel?: string;
  heroHeading?: string;
  heroBody?: string;
  stats?: { label: string; value: string; description: string }[];
  children: React.ReactNode;
};

const DEFAULT_STATS = [
  {
    label: "Live institutions",
    value: "148",
    description:
      "Across primary, high school, and college models",
  },
  {
    label: "Automation health",
    value: "99.3%",
    description:
      "Attendance, billing, and report processing uptime",
  },
];

export function PlatformAuthShell({
  eyebrow = "Platform super admin",
  title,
  description,
  heroLabel = "Platform access",
  heroHeading = "Run every institution from one disciplined control layer.",
  heroBody = "Admissions, academics, finance, and faculty operations arranged into one calm workspace for schools and colleges.",
  stats = DEFAULT_STATS,
  children,
}: PlatformAuthShellProps) {
  return (
    <div className="flex min-h-svh">
      {/* Brand panel — left */}
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(180deg,#123D4A_0%,#0F2B35_100%)] p-10 text-primary-foreground lg:flex lg:w-[55%]">
        {/* Radial glow */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(228,197,124,0.12),transparent_40%)]" />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-white/12 bg-white/8 text-sm font-semibold text-[#ebcf93]">
            E
          </div>
          <div>
            <p className="text-xl font-semibold">Education ERP</p>
            <p className="font-cap text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground/50">
              Multi-campus operations engine
            </p>
          </div>
        </div>

        {/* Hero */}
        <div className="relative max-w-lg space-y-4">
          <p className="font-cap text-[0.7rem] uppercase tracking-[0.2em] text-[#ebcf93]">
            {heroLabel}
          </p>
          <h1 className="text-5xl leading-[1.08] font-bold tracking-tight text-white">
            {heroHeading}
          </h1>
          <p className="max-w-md text-base leading-7 text-primary-foreground/65">
            {heroBody}
          </p>
        </div>

        {/* Stats */}
        <div className="relative flex gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex-1 rounded-2xl border border-white/8 bg-white/6 px-5 py-5"
            >
              <p className="font-cap text-[0.65rem] uppercase tracking-[0.2em] text-primary-foreground/50">
                {stat.label}
              </p>
              <p className="mt-2 text-4xl font-medium text-primary-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-xs leading-5 text-primary-foreground/50">
                {stat.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Form panel — right */}
      <section className="flex flex-1 items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-[522px] rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
          <div className="space-y-4">
            <p className="font-cap text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {eyebrow}
            </p>
            <h2 className="text-[34px] leading-[1.04] font-medium tracking-tight text-foreground">
              {title}
            </h2>
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

          <div className="mt-10">{children}</div>
        </div>
      </section>
    </div>
  );
}
