import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

type EntityListPageProps = {
  actions?: ReactNode;
  children: ReactNode;
  description: string;
  title: string;
  toolbar?: ReactNode;
  className?: string;
};

export function EntityListPage({
  actions,
  children,
  className,
  description,
  title,
  toolbar,
}: EntityListPageProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {actions}
      </div>

      {toolbar ? <div>{toolbar}</div> : null}

      <section className="overflow-hidden rounded-lg border bg-card">
        {children}
      </section>
    </div>
  );
}
