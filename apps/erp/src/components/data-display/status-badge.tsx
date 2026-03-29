import { Badge } from "@repo/ui/components/ui/badge";

const STATUS_STYLES = {
  active:
    "bg-green-500/10 text-green-700 border-green-200 dark:text-green-400 dark:border-green-800",
  inactive: "",
  archived: "",
  deleted:
    "bg-red-500/10 text-red-700 border-red-200 dark:text-red-400 dark:border-red-800",
} as const;

const STATUS_VARIANTS = {
  active: "outline",
  inactive: "secondary",
  archived: "outline",
  deleted: "outline",
} as const;

const STATUS_LABELS: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  archived: "Archived",
  deleted: "Deleted",
};

type StatusBadgeProps = {
  status: string;
  label?: string;
};

export function StatusBadge({ status, label }: StatusBadgeProps) {
  const variant =
    STATUS_VARIANTS[status as keyof typeof STATUS_VARIANTS] ?? "outline";
  const className = STATUS_STYLES[status as keyof typeof STATUS_STYLES] ?? "";
  const displayLabel = label ?? STATUS_LABELS[status] ?? status;

  return (
    <Badge variant={variant} className={className || undefined}>
      {displayLabel}
    </Badge>
  );
}
