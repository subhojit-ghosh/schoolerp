type PageHeaderProps = {
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
};

export function PageHeader({ title, actions, children }: PageHeaderProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  );
}
