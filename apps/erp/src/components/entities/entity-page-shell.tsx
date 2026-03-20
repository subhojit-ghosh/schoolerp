import type { ReactNode } from "react";
import { cn } from "@repo/ui/lib/utils";

const ENTITY_PAGE_WIDTH_CLASS_NAMES = {
  compact: "w-full max-w-4xl",
  form: "w-full max-w-5xl",
  full: "w-full",
} as const;

type EntityPageWidth = keyof typeof ENTITY_PAGE_WIDTH_CLASS_NAMES;

type EntityPageShellProps = {
  children: ReactNode;
  className?: string;
  width?: EntityPageWidth;
};

type EntityPageHeaderProps = {
  actions?: ReactNode;
  backAction?: ReactNode;
  className?: string;
  description?: ReactNode;
  title: ReactNode;
};

type EntityDetailPageHeaderProps = {
  actions?: ReactNode;
  avatar?: ReactNode;
  backAction?: ReactNode;
  badges?: ReactNode;
  className?: string;
  meta?: ReactNode;
  title: ReactNode;
};

export function EntityPageShell({
  children,
  className,
  width = "full",
}: EntityPageShellProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6",
        ENTITY_PAGE_WIDTH_CLASS_NAMES[width],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function EntityPageHeader({
  actions,
  backAction,
  className,
  description,
  title,
}: EntityPageHeaderProps) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="space-y-1">
        {backAction}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function EntityDetailPageHeader({
  actions,
  avatar,
  backAction,
  badges,
  className,
  meta,
  title,
}: EntityDetailPageHeaderProps) {
  return (
    <div
      className={cn("flex flex-wrap items-start justify-between gap-4", className)}
    >
      <div className="flex items-start gap-4">
        {avatar}
        <div className="space-y-1">
          {backAction}
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {badges}
          </div>
          {meta ? <div className="text-sm text-muted-foreground">{meta}</div> : null}
        </div>
      </div>
      {actions}
    </div>
  );
}
