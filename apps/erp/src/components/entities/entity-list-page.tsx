import type { ReactNode } from "react";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";

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
    <EntityPageShell className={className} width="full">
      <EntityPageHeader
        actions={actions}
        description={description}
        title={title}
      />

      {toolbar ? <div>{toolbar}</div> : null}

      <section className="overflow-hidden rounded-lg border bg-card">
        {children}
      </section>
    </EntityPageShell>
  );
}
