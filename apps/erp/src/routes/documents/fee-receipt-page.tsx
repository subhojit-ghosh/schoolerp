import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_QUERY_PARAMS, DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  formatDocumentDate,
  formatDocumentDateTime,
  formatDocumentReference,
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useFeeAssignmentQuery } from "@/features/fees/api/use-fees";
import {
  formatFeeDate,
  formatFeeStatusLabel,
  formatRupees,
} from "@/features/fees/model/fee-formatters";

function toMethodLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function FeeReceiptPage() {
  const { feeAssignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get(DOCUMENT_QUERY_PARAMS.PAYMENT_ID);
  const institutionId = useAuthStore((store) => store.session?.activeOrganization?.id);

  const assignmentQuery = useFeeAssignmentQuery(
    Boolean(institutionId),
    feeAssignmentId,
  );

  const selectedPayment = useMemo(() => {
    const payments = assignmentQuery.data?.payments ?? [];
    if (payments.length === 0) {
      return null;
    }

    const explicitlySelected = paymentId
      ? payments.find((payment) => payment.id === paymentId)
      : null;

    if (explicitlySelected) {
      return explicitlySelected;
    }

    const activePayments = payments.filter((payment) => !payment.reversedAt);

    return activePayments.at(-1) ?? payments.at(-1) ?? null;
  }, [assignmentQuery.data?.payments, paymentId]);

  if (assignmentQuery.isLoading) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.FEE_ASSIGNMENTS}
        subtitle="Loading receipt details..."
        title={DOCUMENT_TITLES.FEE_RECEIPT}
      >
        <p className="text-sm text-muted-foreground">Loading receipt data...</p>
      </PrintDocumentShell>
    );
  }

  if (!assignmentQuery.data || !selectedPayment) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.FEE_ASSIGNMENTS}
        subtitle="No matching payment record was found for this assignment."
        title={DOCUMENT_TITLES.FEE_RECEIPT}
      >
        <p className="text-sm text-muted-foreground">
          Record a payment from the fee assignments flow, then open the receipt
          again.
        </p>
      </PrintDocumentShell>
    );
  }

  const assignment = assignmentQuery.data;

  return (
    <PrintDocumentShell
      backHref={ERP_ROUTES.FEE_ASSIGNMENTS}
      subtitle={`${assignment.studentFullName} · ${assignment.feeStructureName}`}
      title={DOCUMENT_TITLES.FEE_RECEIPT}
    >
      <div className="space-y-8">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PrintDetailItem
            label="Receipt No."
            value={formatDocumentReference("RCT", selectedPayment.id)}
          />
          <PrintDetailItem
            label="Payment Date"
            value={formatDocumentDate(selectedPayment.paymentDate)}
          />
          <PrintDetailItem
            label="Payment Method"
            value={toMethodLabel(selectedPayment.paymentMethod)}
          />
          <PrintDetailItem
            label="Amount Received"
            value={
              <span className="text-lg font-semibold text-[var(--primary)]">
                {formatRupees(selectedPayment.amountInPaise)}
              </span>
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="space-y-4 rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
                Student and fee details
              </h2>
              <Badge variant="outline">{formatFeeStatusLabel(assignment.status)}</Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <PrintDetailItem label="Student" value={assignment.studentFullName} />
              <PrintDetailItem
                label="Admission No."
                value={<span className="font-mono">{assignment.studentAdmissionNumber}</span>}
              />
              <PrintDetailItem label="Campus" value={assignment.campusName ?? "Not assigned"} />
              <PrintDetailItem
                label="Fee Structure"
                value={
                  [assignment.feeStructureName, assignment.installmentLabel]
                    .filter(Boolean)
                    .join(" · ")
                }
              />
              <PrintDetailItem label="Due Date" value={formatFeeDate(assignment.dueDate)} />
              <PrintDetailItem
                label="Reference"
                value={selectedPayment.referenceNumber ?? "Not provided"}
              />
            </div>

            {selectedPayment.notes ? (
              <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Payment Note
                </p>
                <p className="mt-1 text-foreground">{selectedPayment.notes}</p>
              </div>
            ) : null}

            {selectedPayment.reversedAt ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
                <p className="font-medium text-destructive">
                  This payment was reversed on{" "}
                  {formatDocumentDateTime(selectedPayment.reversedAt)}.
                </p>
                {selectedPayment.reversalReason ? (
                  <p className="mt-1 text-muted-foreground">
                    Reason: {selectedPayment.reversalReason}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="rounded-[24px] border border-border/70 bg-muted/10 px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Collection snapshot
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Assigned amount</dt>
                <dd className="font-medium">{formatRupees(assignment.assignedAmountInPaise)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Concessions</dt>
                <dd className="font-medium">{formatRupees(assignment.adjustedAmountInPaise)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt className="text-muted-foreground">Total collected</dt>
                <dd className="font-medium">{formatRupees(assignment.paidAmountInPaise)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-border/70 pt-3">
                <dt className="font-medium text-foreground">Outstanding balance</dt>
                <dd className="text-base font-semibold text-[var(--primary)]">
                  {formatRupees(assignment.outstandingAmountInPaise)}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-[24px] border border-border/70 bg-white px-5 py-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Payment history
            </h2>
            <p className="text-sm text-muted-foreground">
              Generated on {formatDocumentDateTime(selectedPayment.createdAt)}
            </p>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignment.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDocumentDate(payment.paymentDate)}</TableCell>
                    <TableCell>{toMethodLabel(payment.paymentMethod)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {payment.referenceNumber ?? formatDocumentReference("RCT", payment.id)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupees(payment.amountInPaise)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </PrintDocumentShell>
  );
}
