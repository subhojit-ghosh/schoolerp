import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { IconEye } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES, buildPayslipDetailRoute } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  usePayrollRunDetailQuery,
  usePayslipsQuery,
  useProcessPayrollRunMutation,
  useApprovePayrollRunMutation,
  useMarkPaidPayrollRunMutation,
} from "@/features/payroll/api/use-payroll";
import {
  formatMonthYear,
  formatPaiseToRupees,
} from "@/features/payroll/model/payroll-formatters";

type PayrollRunDetail = {
  id: string;
  month: number;
  year: number;
  campusName: string | null;
  status: "draft" | "processed" | "approved" | "paid";
  staffCount: number;
  workingDays: number;
  totalEarningsInPaise: number;
  totalDeductionsInPaise: number;
  totalNetPayInPaise: number;
  createdAt: string;
};

type PayslipRow = {
  id: string;
  staffName: string;
  staffEmployeeId: string | null;
  workingDays: number;
  presentDays: number;
  totalEarningsInPaise: number;
  totalDeductionsInPaise: number;
  netPayInPaise: number;
};

function RunStatusBadge({ status }: { status: PayrollRunDetail["status"] }) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-500/10 text-green-700 border-green-200">
          Paid
        </Badge>
      );
    case "approved":
      return (
        <Badge className="bg-blue-500/10 text-blue-700 border-blue-200">
          Approved
        </Badge>
      );
    case "processed":
      return <Badge variant="secondary">Processed</Badge>;
    default:
      return <Badge variant="outline">Draft</Badge>;
  }
}

export function PayrollRunDetailPage() {
  useDocumentTitle("Payroll Run");
  const { runId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const runQuery = usePayrollRunDetailQuery(canReadPayroll, runId);
  const payslipsQuery = usePayslipsQuery(canReadPayroll, runId ?? "");

  const processMutation = useProcessPayrollRunMutation();
  const approveMutation = useApprovePayrollRunMutation();
  const markPaidMutation = useMarkPaidPayrollRunMutation();

  const run = runQuery.data as PayrollRunDetail | undefined;
  const payslips = useMemo(
    () =>
      ((payslipsQuery.data as { rows?: unknown[] } | undefined)?.rows ??
        payslipsQuery.data ??
        []) as PayslipRow[],
    [payslipsQuery.data],
  );

  async function handleProcess() {
    if (!runId) return;
    try {
      await processMutation.mutateAsync({ params: { path: { runId } } });
      toast.success("Payroll run processed.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not process payroll run. Please try again.",
        ),
      );
    }
  }

  async function handleApprove() {
    if (!runId) return;
    try {
      await approveMutation.mutateAsync({ params: { path: { runId } } });
      toast.success("Payroll run approved.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not approve payroll run. Please try again.",
        ),
      );
    }
  }

  async function handleMarkPaid() {
    if (!runId) return;
    try {
      await markPaidMutation.mutateAsync({ params: { path: { runId } } });
      toast.success("Payroll run marked as paid.");
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not mark payroll run as paid. Please try again.",
        ),
      );
    }
  }

  if (runQuery.isLoading) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </EntityPageShell>
    );
  }

  if (!run) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-12 text-center">
          <p className="font-medium">Payroll run not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The payroll run you are looking for does not exist.
          </p>
        </div>
      </EntityPageShell>
    );
  }

  const isActionPending =
    processMutation.isPending ||
    approveMutation.isPending ||
    markPaidMutation.isPending;

  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        backAction={
          <Breadcrumbs
            items={[
              { label: "Payroll Runs", href: ERP_ROUTES.PAYROLL_RUNS },
              { label: formatMonthYear(run.month, run.year) },
            ]}
          />
        }
        title={formatMonthYear(run.month, run.year)}
        badges={<RunStatusBadge status={run.status} />}
        meta={run.campusName ?? "All campuses"}
        actions={
          canManagePayroll ? (
            <div className="flex items-center gap-2">
              {run.status === "draft" ? (
                <Button
                  size="sm"
                  disabled={isActionPending}
                  onClick={() => void handleProcess()}
                >
                  {processMutation.isPending ? "Processing..." : "Process"}
                </Button>
              ) : null}
              {run.status === "processed" ? (
                <Button
                  size="sm"
                  disabled={isActionPending}
                  onClick={() => void handleApprove()}
                >
                  {approveMutation.isPending ? "Approving..." : "Approve"}
                </Button>
              ) : null}
              {run.status === "approved" ? (
                <Button
                  size="sm"
                  disabled={isActionPending}
                  onClick={() => void handleMarkPaid()}
                >
                  {markPaidMutation.isPending ? "Marking..." : "Mark paid"}
                </Button>
              ) : null}
            </div>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <SummaryCard label="Staff Count" value={String(run.staffCount)} />
        <SummaryCard label="Working Days" value={String(run.workingDays)} />
        <SummaryCard
          label="Total Earnings"
          value={formatPaiseToRupees(run.totalEarningsInPaise)}
        />
        <SummaryCard
          label="Total Deductions"
          value={formatPaiseToRupees(run.totalDeductionsInPaise)}
        />
        <SummaryCard
          label="Net Pay"
          value={formatPaiseToRupees(run.totalNetPayInPaise)}
          highlight
        />
      </div>

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">
            Payslips ({Array.isArray(payslips) ? payslips.length : 0})
          </h2>
        </div>

        {payslipsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading payslips...
          </div>
        ) : !Array.isArray(payslips) || payslips.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              {run.status === "draft"
                ? "Process the payroll run to generate payslips."
                : "No payslips found for this run."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Staff
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Employee ID
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Working Days
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Present Days
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Earnings
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Deductions
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Net Pay
                  </TableHead>
                  <TableHead className="h-10 w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {payslips.map((slip) => (
                  <TableRow key={slip.id}>
                    <TableCell className="font-medium text-sm">
                      {slip.staffName}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {slip.staffEmployeeId || "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {slip.workingDays}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {slip.presentDays}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPaiseToRupees(slip.totalEarningsInPaise)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatPaiseToRupees(slip.totalDeductionsInPaise)}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatPaiseToRupees(slip.netPayInPaise)}
                    </TableCell>
                    <TableCell>
                      <Button
                        asChild
                        size="icon"
                        variant="ghost"
                        className="size-8"
                      >
                        <Link to={buildPayslipDetailRoute(slip.id)}>
                          <IconEye className="size-4" />
                          <span className="sr-only">View payslip</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </EntityPageShell>
  );
}

function SummaryCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={`mt-1 text-lg font-semibold ${highlight ? "text-[var(--primary)]" : ""}`}
      >
        {value}
      </p>
    </div>
  );
}
