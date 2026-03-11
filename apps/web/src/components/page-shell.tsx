type PageShellProps = {
  label?: string;
  title: string;
  meta?: string;
  description?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageShell({
  label,
  title,
  meta,
  description,
  actions,
  children,
}: PageShellProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-3 rounded-[24px] border border-border/70 bg-[var(--shell-elevated)] px-4 py-3.5 shadow-[0_12px_32px_-28px_rgba(15,45,53,0.45)] lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          {label && (
            <p className="font-cap text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              {label}
            </p>
          )}
          <div className="space-y-1">
            <h1 className="text-[2.125rem] leading-none font-medium tracking-tight">{title}</h1>
            {description ? (
              <p className="max-w-2xl text-[0.9375rem] text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {meta ? (
            <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              {meta}
            </span>
          ) : null}
          <div className="flex shrink-0 items-center gap-3">{actions}</div>
        </div>
      </div>
      {children}
    </div>
  );
}
