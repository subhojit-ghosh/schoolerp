"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { institutionColumns } from "@/components/platform/institution-columns";
import { ROUTES } from "@/constants";
import { PageHeader } from "@/components/page-header";
import type { ListInstitutionsResult } from "@/server/institutions/queries";

type InstitutionListProps = {
  result: ListInstitutionsResult;
};

export function InstitutionList({ result }: InstitutionListProps) {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Institutions"
        actions={
          <Link href={ROUTES.ADMIN.NEW_INSTITUTION as never}>
            <Button size="sm">
              <PlusIcon className="mr-2 size-4" />
              New institution
            </Button>
          </Link>
        }
      />

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
