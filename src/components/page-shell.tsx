type PageShellProps = {
  label?: string;
  title: string;
  meta?: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageShell({ label, title, meta, actions, children }: PageShellProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          {label && (
            <p className="mb-1 font-cap text-xs font-medium uppercase tracking-[0.15em] text-muted-foreground">
              {label}
            </p>
          )}
          <h1 className="text-[30px] font-medium tracking-tight">
            {title}
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {meta && (
            <span className="text-sm text-muted-foreground">{meta}</span>
          )}
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}
