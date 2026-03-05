"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/ui/data-table";
import { InstitutionActions } from "@/components/platform/institution-actions";
import { STATUS } from "@/constants";
import { INSTITUTION_TYPES } from "@/server/institutions/schemas";
import type { InstitutionRow } from "@/server/institutions/queries";

function typeLabel(value: string | null) {
  if (!value) return "—";
  return INSTITUTION_TYPES.find((t) => t.value === value)?.label ?? value;
}

export const institutionColumns: ColumnDef<InstitutionRow>[] = [
  {
    accessorKey: "name",
    header: ({ table }) => {
      const { sort, currentSort, currentOrder } = table.options.meta as {
        sort: (id: string) => void;
        currentSort: string;
        currentOrder: string;
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
      <span className="font-medium">{row.getValue("name")}</span>
    ),
  },
  {
    accessorKey: "slug",
    header: ({ table }) => {
      const { sort, currentSort, currentOrder } = table.options.meta as {
        sort: (id: string) => void;
        currentSort: string;
        currentOrder: string;
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
      <span className="text-muted-foreground font-mono text-xs">
        {row.getValue("slug")}
      </span>
    ),
  },
  {
    accessorKey: "institutionType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="outline">
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
