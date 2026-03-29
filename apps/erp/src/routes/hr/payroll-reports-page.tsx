import { useMemo, useState } from "react";
import { PERMISSIONS } from "@repo/contracts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { usePayrollRunsQuery } from "@/features/payroll/api/use-payroll";
import { formatPaiseToRupees } from "@/features/payroll/model/payroll-formatters";
import { MONTH_LABELS } from "@/features/payroll/model/payroll-constants";

const CURRENT_YEAR = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - 2 + i);

export function PayrollReportsPage() {
  useDocumentTitle("Payroll Reports");
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.PAYROLL_READ);

  const [selectedYear, setSelectedYear] = useState(String(CURRENT_YEAR));

  const runsQuery = usePayrollRunsQuery(canRead, {
    year: Number(selectedYear),
    limit: 50,
    sort: "month",
    order: "asc",
  });

  const runsData = runsQuery.data;
  const runs = useMemo(() => runsData?.rows ?? [], [runsData]);

  // Build a 12-month summary grid
  const monthlySummary = useMemo(() => {
    return MONTH_LABELS.map((label, i) => {
      const month = i + 1;
      const run = runs.find((r: Record<string, unknown>) => r.month === month);
      return {
        month,
        label,
        status: (run?.status as string) ?? null,
        staffCount: (run?.staffCount as number) ?? 0,
        totalEarnings: (run?.totalEarningsInPaise as number) ?? 0,
        totalDeductions: (run?.totalDeductionsInPaise as number) ?? 0,
        totalNetPay: (run?.totalNetPayInPaise as number) ?? 0,
      };
    });
  }, [runs]);

  const yearTotals = useMemo(() => {
    return monthlySummary.reduce(
      (acc, m) => ({
        earnings: acc.earnings + m.totalEarnings,
        deductions: acc.deductions + m.totalDeductions,
        netPay: acc.netPay + m.totalNetPay,
      }),
      { earnings: 0, deductions: 0, netPay: 0 },
    );
  }, [monthlySummary]);

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        title="Payroll Reports"
        description="Yearly payroll summary across all months."
      />

      <div className="flex items-center gap-4 rounded-lg border bg-card p-4">
        <label className="text-sm font-medium text-muted-foreground">
          Year
        </label>
        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YEAR_OPTIONS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {runsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Month
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-center">
                    Status
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-center">
                    Staff
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlySummary.map((m) => (
                  <TableRow key={m.month}>
                    <TableCell className="text-sm font-medium">
                      {m.label}
                    </TableCell>
                    <TableCell className="text-center">
                      {m.status ? (
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            m.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : m.status === "approved"
                                ? "bg-blue-100 text-blue-700"
                                : m.status === "processed"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {m.status.charAt(0).toUpperCase() + m.status.slice(1)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm">
                      {m.staffCount || "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.totalEarnings
                        ? formatPaiseToRupees(m.totalEarnings)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {m.totalDeductions
                        ? formatPaiseToRupees(m.totalDeductions)
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {m.totalNetPay ? formatPaiseToRupees(m.totalNetPay) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/20 font-semibold">
                  <TableCell className="text-sm" colSpan={3}>
                    Year Total
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {yearTotals.earnings
                      ? formatPaiseToRupees(yearTotals.earnings)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {yearTotals.deductions
                      ? formatPaiseToRupees(yearTotals.deductions)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {yearTotals.netPay
                      ? formatPaiseToRupees(yearTotals.netPay)
                      : "—"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </EntityPageShell>
  );
}
