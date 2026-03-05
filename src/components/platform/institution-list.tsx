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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Institutions</h1>
          <p className="text-muted-foreground text-xs">
            {result.total} institution{result.total !== 1 ? "s" : ""}
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
          pageCount: result.pageCount,
          total: result.total,
        }}
        searchKey="name"
        searchPlaceholder="Filter institutions..."
      />
    </div>
  );
}
