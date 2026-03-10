type PageShellProps = {
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageShell({ title, actions, children }: PageShellProps) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h1>
        {actions}
      </div>
      {children}
    </div>
  );
}
