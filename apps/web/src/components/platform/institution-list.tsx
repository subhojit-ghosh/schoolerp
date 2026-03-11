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
  total: "border-border/70 bg-[var(--shell-elevated)] text-foreground",
  active:
    "border-transparent bg-[linear-gradient(135deg,#143640_0%,#0f2d35_100%)] text-primary-foreground",
  suspended: "border-[#e4d2bf] bg-[#f6ede1] text-[#8d542e]",
} as const;

export function InstitutionList({ result, counts }: InstitutionListProps) {
  return (
    <PageShell
      label="Platform control"
      title="Institution registry"
      meta={`${counts.total} institutions`}
      actions={
        <Link href={ROUTES.ADMIN.NEW_INSTITUTION as never}>
          <Button size="sm" className="rounded-2xl px-4">
            <PlusIcon className="mr-2 size-4" />
            New institution
          </Button>
        </Link>
      }
    >
      <div className="space-y-2.5">
        <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1.1fr]">
          <div className={`rounded-[22px] border px-4 py-3.5 ${METRIC_CARD_STYLES.total}`}>
            <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-muted-foreground">
              Total institutions
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight">{counts.total}</p>
              <p className="text-sm text-muted-foreground">
                {result.rows.length} on this page
              </p>
            </div>
          </div>

          <div className={`rounded-[22px] border px-4 py-3.5 ${METRIC_CARD_STYLES.active}`}>
            <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-primary-foreground/70">
              Active
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold tracking-tight">{counts.active}</p>
              <p className="text-sm text-primary-foreground/70">Healthy institutions</p>
            </div>
          </div>

          <div
            className={`rounded-[22px] border px-4 py-3.5 ${METRIC_CARD_STYLES.suspended}`}
          >
            <p className="text-[0.6875rem] uppercase tracking-[0.22em] text-[#b67a4f]">
              Suspended
            </p>
            <div className="mt-3 flex items-end justify-between gap-3">
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
