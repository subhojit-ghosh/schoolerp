"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { institutionColumns } from "@/components/platform/institution-columns";
import { ROUTES } from "@/constants";
import type { ListInstitutionsResult } from "@/server/institutions/queries";

type InstitutionListProps = {
  result: ListInstitutionsResult;
};

export function InstitutionList({ result }: InstitutionListProps) {
  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Institutions</h2>
          <p className="text-muted-foreground">
            Manage your institutions and their configurations here.
          </p>
        </div>
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION as never}>
          <Button>
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      </div>

      <DataTable
        columns={institutionColumns}
        data={result.rows}
        pagination={{
          page: result.page,
          pageSize: result.pageSize,
          pageCount: result.pageCount,
          total: result.total,
        }}
        searchKey="name"
        searchPlaceholder="Filter institutions..."
      />
    </div>
  );
}
