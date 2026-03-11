"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/ui/data-table";
import { InstitutionActions } from "@/components/platform/institution-actions";
import { SORT_ORDERS, STATUS } from "@/constants";
import { INSTITUTION_TYPES } from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";

type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

const CREATED_AT_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "UTC",
});

function typeLabel(value: string | null) {
  if (!value) return "—";
  return INSTITUTION_TYPES.find((t) => t.value === value)?.label ?? value;
}

function getStatusBadgeClassName(status: string | null) {
  if (status === STATUS.ORG.SUSPENDED) {
    return "border-[#e4cfba] bg-[#f7efe4] text-[#87522f]";
  }

  return "border-teal-900/10 bg-teal-900 text-primary-foreground";
}

function getTypeBadgeClassName() {
  return "border-border/70 bg-background/90 text-foreground";
}

export const institutionColumns: ColumnDef<InstitutionRow>[] = [
  {
    accessorKey: "name",
    header: ({ table }) => {
      const { sort, currentSort, currentOrder } = table.options.meta as {
        sort: (id: string) => void;
        currentSort: string;
        currentOrder: SortOrder;
      };
      return (
        <SortableHeader
          columnId="name"
          label="Name"
          sort={sort}
          currentSort={currentSort}
          currentOrder={currentOrder}
        />
      );
    },
    cell: ({ row }) => (
      <div className="space-y-0.5 py-0.5">
        <p className="text-[0.95rem] font-medium text-foreground">
          {row.getValue("name")}
        </p>
        <p className="text-sm text-muted-foreground">
          Created {CREATED_AT_FORMATTER.format(row.original.createdAt)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ table }) => {
      const { sort, currentSort, currentOrder } = table.options.meta as {
        sort: (id: string) => void;
        currentSort: string;
        currentOrder: SortOrder;
      };
      return (
        <SortableHeader
          columnId="slug"
          label="Slug"
          sort={sort}
          currentSort={currentSort}
          currentOrder={currentOrder}
        />
      );
    },
    cell: ({ row }) => (
      <span className="font-mono text-[0.875rem] tracking-[0.08em] text-muted-foreground">
        {row.getValue("slug")}
      </span>
    ),
  },
  {
    accessorKey: "institutionType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline" className={getTypeBadgeClassName()}>
        {typeLabel(row.getValue("institutionType"))}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string | null;
      return (
        <Badge
          variant={status === STATUS.ORG.ACTIVE ? "default" : "secondary"}
          className={`min-w-22 justify-center rounded-full px-2.5 py-0 ${getStatusBadgeClassName(status)}`}
        >
          {status ?? STATUS.ORG.ACTIVE}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => (
      <InstitutionActions
        id={row.original.id}
        status={row.original.status}
      />
    ),
  },
];
