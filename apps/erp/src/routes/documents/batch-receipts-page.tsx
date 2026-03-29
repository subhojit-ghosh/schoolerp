import { useSearchParams } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { FEES_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
import { formatDocumentDate } from "@/features/documents/ui/print-document-formatters";

function useBatchReceiptsQuery(
  startDate: string | undefined,
  endDate: string | undefined,
  classId: string | undefined,
  feeStructureId: string | undefined,
  enabled: boolean,
) {
  return apiQueryClient.useQuery(
    "get",
    FEES_API_PATHS.BATCH_RECEIPTS,
    {
      params: {
        query: {
          startDate: startDate ?? "",
          endDate: endDate ?? "",
          ...(classId ? { classId } : {}),
          ...(feeStructureId ? { feeStructureId } : {}),
        },
      },
    },
    { enabled },
  );
}

export function BatchReceiptsPage() {
  useDocumentTitle("Batch Receipts");
  const [searchParams] = useSearchParams();
  const startDate = searchParams.get("startDate") ?? undefined;
  const endDate = searchParams.get("endDate") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;
  const feeStructureId = searchParams.get("feeStructureId") ?? undefined;

  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const branding = readCachedTenantBranding();

  const receiptsQuery = useBatchReceiptsQuery(
    startDate,
    endDate,
    classId,
    feeStructureId,
    Boolean(institutionId),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const receipts = (receiptsQuery.data ?? []) as any[];

  if (receiptsQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Loading receipts...</p>
      </div>
    );
  }

  if (receipts.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">
          No receipts found for this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 print:hidden">
        <Button onClick={() => window.print()}>
          Print all {receipts.length} receipts
        </Button>
        <span className="ml-3 text-sm text-muted-foreground">
          {receipts.length} receipt{receipts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {receipts.map(
        (
          receipt: {
            paymentId: string;
            receiptNumber: string | null;
            amountInPaise: number;
            paymentDate: string;
            paymentMethod: string;
            referenceNumber: string | null;
            studentFullName: string;
            admissionNumber: string;
            className: string;
            sectionName: string;
            feeStructureName: string;
            installmentLabel: string | null;
            assignedAmountInPaise: number;
          },
          index: number,
        ) => (
          <div
            key={receipt.paymentId}
            className="mx-auto max-w-[210mm] bg-white px-8 py-6"
            style={{
              pageBreakAfter:
                index < receipts.length - 1 ? "always" : "auto",
            }}
          >
            {/* Header */}
            <div className="mb-4 border-b pb-3 text-center">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt=""
                  className="mx-auto mb-2 h-10"
                />
              ) : null}
              <h1 className="text-base font-bold">
                {branding?.institutionName ?? "Fee Receipt"}
              </h1>
              <p className="text-xs text-muted-foreground">Fee Receipt</p>
            </div>

            {/* Receipt details */}
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Receipt No: </span>
                <span className="font-medium">
                  {receipt.receiptNumber ??
                    `RCT-${receipt.paymentId.replace(/-/g, "").slice(-8).toUpperCase()}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Date: </span>
                <span className="font-medium">
                  {formatDocumentDate(receipt.paymentDate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Student: </span>
                <span className="font-medium">{receipt.studentFullName}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Admission No: </span>
                <span className="font-medium">{receipt.admissionNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Class: </span>
                <span className="font-medium">
                  {receipt.className} {receipt.sectionName}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Method: </span>
                <span className="font-medium capitalize">
                  {receipt.paymentMethod.replace("_", " ")}
                </span>
              </div>
            </div>

            {/* Fee details */}
            <table className="mb-4 w-full border-collapse border text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border px-3 py-1.5 text-left font-medium">
                    Fee Structure
                  </th>
                  <th className="border px-3 py-1.5 text-left font-medium">
                    Installment
                  </th>
                  <th className="border px-3 py-1.5 text-right font-medium">
                    Amount Paid
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border px-3 py-1.5">
                    {receipt.feeStructureName}
                  </td>
                  <td className="border px-3 py-1.5">
                    {receipt.installmentLabel ?? "-"}
                  </td>
                  <td className="border px-3 py-1.5 text-right font-semibold tabular-nums">
                    {"\u20B9"}
                    {(receipt.amountInPaise / 100).toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>

            {receipt.referenceNumber ? (
              <p className="mb-2 text-xs text-muted-foreground">
                Reference: {receipt.referenceNumber}
              </p>
            ) : null}

            <p className="mt-6 text-center text-xs text-muted-foreground">
              This is a computer-generated receipt.
            </p>
          </div>
        ),
      )}
    </div>
  );
}
