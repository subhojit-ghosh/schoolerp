"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { institutionColumns } from "@/components/platform/institution-columns";
import { ROUTES } from "@/constants";
import { PageShell } from "@/components/page-shell";
import type {
  InstitutionCounts,
  ListInstitutionsResult,
} from "@/server/institutions/queries";

type InstitutionListProps = {
  result: ListInstitutionsResult;
  counts: InstitutionCounts;
};

const METRIC_CARD_STYLES = {
  total: "border-border/60 bg-card text-foreground",
  active:
    "border-transparent bg-[linear-gradient(135deg,#143640_0%,#0f2d35_100%)] text-primary-foreground",
  suspended: "border-[#ead8c5] bg-[#f7efe5] text-[#8d542e]",
} as const;

export function InstitutionList({ result, counts }: InstitutionListProps) {
  return (
    <PageShell
      title="Institution registry"
      actions={
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION as never}>
          <Button size="sm" className="rounded-xl">
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 lg:grid-cols-3">
          <div className={`rounded-[26px] border px-4 py-4 ${METRIC_CARD_STYLES.total}`}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-muted-foreground">
              Total institutions
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight">{counts.total}</p>
              <p className="text-sm text-muted-foreground">
                {result.rows.length} on this page
              </p>
            </div>
          </div>

          <div className={`rounded-[26px] border px-4 py-4 ${METRIC_CARD_STYLES.active}`}>
            <p className="text-[11px] uppercase tracking-[0.24em] text-primary-foreground/70">
              Active
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight">{counts.active}</p>
              <p className="text-sm text-primary-foreground/70">Healthy institutions</p>
            </div>
          </div>

          <div
            className={`rounded-[26px] border px-4 py-4 ${METRIC_CARD_STYLES.suspended}`}
          >
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#b67a4f]">
              Suspended
            </p>
            <div className="mt-4 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight">{counts.suspended}</p>
              <p className="text-sm text-[#a06b46]">Needs review</p>
            </div>
          </div>
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
          toolbarContent={
            <>
              <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {result.total} total
              </div>
              <div className="rounded-full border border-border/70 bg-background px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                Page {result.page} of {result.pageCount}
              </div>
            </>
          }
        />
      </div>
    </PageShell>
  );
}
