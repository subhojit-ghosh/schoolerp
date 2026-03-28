import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { IconPrinter } from "@tabler/icons-react";
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
import {
  ERP_ROUTES,
  buildPayrollRunDetailRoute,
  buildPayslipPrintRoute,
} from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { usePayslipDetailQuery } from "@/features/payroll/api/use-payroll";
import { formatPaiseToRupees } from "@/features/payroll/model/payroll-formatters";

type PayslipLineItem = {
  id: string;
  componentName: string;
  componentType: "earning" | "deduction";
  amountInPaise: number;
};

type PayslipDetail = {
  id: string;
  payrollRunId: string;
  staffName: string;
  staffEmployeeId: string | null;
  staffDesignation: string | null;
  staffDepartment: string | null;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  totalEarningsInPaise: number;
  totalDeductionsInPaise: number;
  netPayInPaise: number;
  lineItems: PayslipLineItem[];
};

export function PayslipDetailPage() {
  useDocumentTitle("Payslip");
  const { payslipId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);

  const payslipQuery = usePayslipDetailQuery(canReadPayroll, payslipId);
  const payslip = payslipQuery.data as PayslipDetail | undefined;

  const earnings = useMemo(
    () =>
      (payslip?.lineItems ?? []).filter(
        (item) => item.componentType === "earning",
      ),
    [payslip?.lineItems],
  );

  const deductions = useMemo(
    () =>
      (payslip?.lineItems ?? []).filter(
        (item) => item.componentType === "deduction",
      ),
    [payslip?.lineItems],
  );

  if (payslipQuery.isLoading) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </EntityPageShell>
    );
  }

  if (!payslip) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-12 text-center">
          <p className="font-medium">Payslip not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The payslip you are looking for does not exist.
          </p>
        </div>
      </EntityPageShell>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        backAction={
          <Breadcrumbs
            items={[
              { label: "Payroll Runs", href: ERP_ROUTES.PAYROLL_RUNS },
              { label: "Run", href: buildPayrollRunDetailRoute(payslip.payrollRunId) },
              { label: payslip.staffName },
            ]}
          />
        }
        title={payslip.staffName}
        badges={
          payslip.staffEmployeeId ? (
            <Badge variant="outline">{payslip.staffEmployeeId}</Badge>
          ) : null
        }
        meta={
          [payslip.staffDesignation, payslip.staffDepartment]
            .filter(Boolean)
            .join(" · ") || undefined
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to={buildPayslipPrintRoute(payslipId!)}>
              <IconPrinter className="size-4" />
              Print
            </Link>
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard label="Working Days" value={String(payslip.workingDays)} />
        <InfoCard label="Present Days" value={String(payslip.presentDays)} />
        <InfoCard label="Paid Leave" value={String(payslip.paidLeaveDays)} />
        <InfoCard label="Unpaid Leave" value={String(payslip.unpaidLeaveDays)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">
              Earnings ({earnings.length})
            </h2>
          </div>
          {earnings.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No earning components.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                      Component
                    </TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnings.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.componentName}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPaiseToRupees(item.amountInPaise)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/20">
                    <TableCell className="text-sm font-semibold">
                      Total Earnings
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatPaiseToRupees(payslip.totalEarningsInPaise)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h2 className="text-sm font-medium">
              Deductions ({deductions.length})
            </h2>
          </div>
          {deductions.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No deduction components.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                      Component
                    </TableHead>
                    <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                      Amount
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deductions.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-sm">
                        {item.componentName}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium">
                        {formatPaiseToRupees(item.amountInPaise)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/20">
                    <TableCell className="text-sm font-semibold">
                      Total Deductions
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold">
                      {formatPaiseToRupees(payslip.totalDeductionsInPaise)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between">
          <p className="text-lg font-semibold">Net Pay</p>
          <p className="text-2xl font-bold text-[var(--primary)]">
            {formatPaiseToRupees(payslip.netPayInPaise)}
          </p>
        </div>
      </div>
    </EntityPageShell>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}
