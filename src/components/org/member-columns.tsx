"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { SortableHeader } from "@/components/ui/data-table";
import { MemberActions } from "@/components/org/member-actions";
import { SORT_ORDERS, STATUS } from "@/constants";
import type { MemberRoleOption, MemberRow } from "@/server/members/queries";

type SortOrder = (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];

export function getMemberColumns(
  roleOptions: MemberRoleOption[],
): ColumnDef<MemberRow>[] {
  return [
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
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      accessorKey: "email",
      header: ({ table }) => {
        const { sort, currentSort, currentOrder } = table.options.meta as {
          sort: (id: string) => void;
          currentSort: string;
          currentOrder: SortOrder;
        };
        return (
          <SortableHeader
            columnId="email"
            label="Email"
            sort={sort}
            currentSort={currentSort}
            currentOrder={currentOrder}
          />
        );
      },
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">{row.original.email}</span>
      ),
    },
    {
      accessorKey: "roleName",
      header: "Role",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.roleName ?? "No role"}</Badge>
      ),
    },
    {
      accessorKey: "status",
      header: ({ table }) => {
        const { sort, currentSort, currentOrder } = table.options.meta as {
          sort: (id: string) => void;
          currentSort: string;
          currentOrder: SortOrder;
        };
        return (
          <SortableHeader
            columnId="status"
            label="Status"
            sort={sort}
            currentSort={currentSort}
            currentOrder={currentOrder}
          />
        );
      },
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === STATUS.MEMBER.ACTIVE ? "default" : "secondary"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => (
        <MemberActions
          memberId={row.original.memberId}
          status={row.original.status}
          roleId={row.original.roleId}
          roleOptions={roleOptions}
        />
      ),
    },
  ];
}
