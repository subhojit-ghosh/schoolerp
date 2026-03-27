import { useMemo } from "react";
import { useParams } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ERP_ROUTES, buildPayslipDetailRoute } from "@/constants/routes";
import { PERMISSIONS } from "@repo/contracts";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
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
  month: number;
  year: number;
  workingDays: number;
  presentDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  totalEarningsInPaise: number;
  totalDeductionsInPaise: number;
  netPayInPaise: number;
  lineItems: PayslipLineItem[];
};

export function PayslipPrintPage() {
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
      <PrintDocumentShell
        backHref={ERP_ROUTES.PAYROLL_RUNS}
        subtitle="Loading payslip details..."
        title="Payslip"
      >
        <p className="text-sm text-muted-foreground">Loading payslip data...</p>
      </PrintDocumentShell>
    );
  }

  if (!payslip) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.PAYROLL_RUNS}
        subtitle="No matching payslip record was found."
        title="Payslip"
      >
        <p className="text-sm text-muted-foreground">
          The payslip could not be found. Navigate back to payroll runs and try
          again.
        </p>
      </PrintDocumentShell>
    );
  }

  const backHref = buildPayslipDetailRoute(payslipId!);

  return (
    <PrintDocumentShell
      backHref={backHref}
      subtitle={`${payslip.staffName} · ${payslip.staffEmployeeId ?? "No Employee ID"}`}
      title="Payslip"
    >
      <div className="space-y-8">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PrintDetailItem label="Employee" value={payslip.staffName} />
          <PrintDetailItem
            label="Employee ID"
            value={payslip.staffEmployeeId ?? "-"}
          />
          <PrintDetailItem
            label="Designation"
            value={payslip.staffDesignation ?? "-"}
          />
          <PrintDetailItem
            label="Department"
            value={payslip.staffDepartment ?? "-"}
          />
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PrintDetailItem
            label="Working Days"
            value={String(payslip.workingDays)}
          />
          <PrintDetailItem
            label="Present Days"
            value={String(payslip.presentDays)}
          />
          <PrintDetailItem
            label="Paid Leave"
            value={String(payslip.paidLeaveDays)}
          />
          <PrintDetailItem
            label="Unpaid Leave"
            value={String(payslip.unpaidLeaveDays)}
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4 rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Earnings
            </h2>
            {earnings.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No earning components.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.componentName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPaiseToRupees(item.amountInPaise)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/20 font-semibold">
                      <TableCell>Total Earnings</TableCell>
                      <TableCell className="text-right">
                        {formatPaiseToRupees(payslip.totalEarningsInPaise)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Deductions
            </h2>
            {deductions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No deduction components.
              </p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deductions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.componentName}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPaiseToRupees(item.amountInPaise)}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/20 font-semibold">
                      <TableCell>Total Deductions</TableCell>
                      <TableCell className="text-right">
                        {formatPaiseToRupees(payslip.totalDeductionsInPaise)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-[linear-gradient(135deg,color-mix(in_srgb,var(--primary)_8%,white),white)] px-6 py-6">
          <div className="flex items-center justify-between">
            <h2 className="font-[family:var(--font-heading)] text-2xl font-semibold">
              Net Pay
            </h2>
            <p className="text-3xl font-bold text-[var(--primary)]">
              {formatPaiseToRupees(payslip.netPayInPaise)}
            </p>
          </div>
        </section>
      </div>
    </PrintDocumentShell>
  );
}
