import { useCallback, useMemo, useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { IconPackage } from "@tabler/icons-react";
import { createColumnHelper } from "@tanstack/react-table";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { PERMISSIONS } from "@repo/contracts";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ERP_ROUTES } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useGetPurchaseOrderQuery,
  useUpdatePurchaseOrderStatusMutation,
  useReceivePurchaseOrderMutation,
} from "@/features/inventory/api/use-inventory";
import {
  PURCHASE_ORDER_STATUS_LABELS,
} from "@/features/inventory/model/inventory-constants";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  ServerDataTable,
} from "@/components/data-display/server-data-table";
import { useServerDataTable } from "@/hooks/use-server-data-table";

type POItemRow = {
  id: string;
  itemId: string;
  itemName: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPriceInPaise: number;
};

const columnHelper = createColumnHelper<POItemRow>();

const PO_STATUS_BADGE_CLASSES: Record<string, string> = {
  draft: "bg-gray-500/10 text-gray-700 border-gray-200",
  ordered: "bg-blue-500/10 text-blue-700 border-blue-200",
  partially_received: "bg-orange-500/10 text-orange-700 border-orange-200",
  received: "bg-green-500/10 text-green-700 border-green-200",
  cancelled: "bg-red-500/10 text-red-700 border-red-200",
};

function formatAmountFromPaise(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function InventoryPurchaseOrderDetailPage() {
  const { orderId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canRead = hasPermission(session, PERMISSIONS.INVENTORY_READ);
  const canManage = hasPermission(session, PERMISSIONS.INVENTORY_MANAGE);

  const orderQuery = useGetPurchaseOrderQuery(canRead, orderId);
  const statusMutation = useUpdatePurchaseOrderStatusMutation();
  const receiveMutation = useReceivePurchaseOrderMutation();

  const orderData = orderQuery.data;

  useDocumentTitle(
    orderData ? `PO ${orderData.orderNumber}` : "Purchase Order",
  );

  // ── Receive quantities state ──────────────────────────────────────────────
  const [receiveQuantities, setReceiveQuantities] = useState<
    Record<string, number>
  >({});
  const [showReceiveForm, setShowReceiveForm] = useState(false);

  const handleReceiveQuantityChange = useCallback(
    (itemId: string, value: string) => {
      setReceiveQuantities((prev) => ({
        ...prev,
        [itemId]: value === "" ? 0 : parseInt(value, 10),
      }));
    },
    [],
  );

  const handleReceive = useCallback(async () => {
    if (!orderId) return;
    const lines = Object.entries(receiveQuantities)
      .filter(([, qty]) => qty > 0)
      .map(([purchaseOrderItemId, quantityReceived]) => ({
        purchaseOrderItemId,
        quantityReceived,
      }));

    if (lines.length === 0) {
      toast.error("Enter at least one quantity to receive.");
      return;
    }

    try {
      await receiveMutation.mutateAsync({
        params: { path: { orderId } },
        body: { lines },
      });
      toast.success("Goods received successfully.");
      setShowReceiveForm(false);
      setReceiveQuantities({});
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not receive goods. Please try again."),
      );
    }
  }, [orderId, receiveQuantities, receiveMutation]);

  const handleStatusChange = useCallback(
    async (
      newStatus:
        | "draft"
        | "ordered"
        | "partially_received"
        | "received"
        | "cancelled",
    ) => {
      if (!orderId) return;
      try {
        await statusMutation.mutateAsync({
          params: { path: { orderId } },
          body: { status: newStatus },
        });
        toast.success(`Order status updated to ${PURCHASE_ORDER_STATUS_LABELS[newStatus]}.`);
      } catch (error) {
        toast.error(
          extractApiError(error, "Could not update status. Please try again."),
        );
      }
    },
    [orderId, statusMutation],
  );

  const items = useMemo(
    () => (orderData?.items ?? []) as POItemRow[],
    [orderData?.items],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("itemName", {
        header: "Item",
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.itemName}</span>
        ),
      }),
      columnHelper.accessor("quantityOrdered", {
        header: "Qty Ordered",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.quantityOrdered}</span>
        ),
      }),
      columnHelper.accessor("quantityReceived", {
        header: "Qty Received",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.quantityReceived}</span>
        ),
      }),
      columnHelper.accessor("unitPriceInPaise", {
        header: "Unit Price",
        cell: ({ row }) => (
          <span className="text-sm">
            {formatAmountFromPaise(row.original.unitPriceInPaise)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "lineTotal",
        header: "Line Total",
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatAmountFromPaise(
              row.original.quantityOrdered * row.original.unitPriceInPaise,
            )}
          </span>
        ),
      }),
      ...(showReceiveForm
        ? [
            columnHelper.display({
              id: "receiveInput",
              header: "Receive Qty",
              cell: ({ row }) => {
                const remaining =
                  row.original.quantityOrdered - row.original.quantityReceived;
                if (remaining <= 0) {
                  return (
                    <span className="text-sm text-muted-foreground">
                      Fully received
                    </span>
                  );
                }
                return (
                  <Input
                    type="number"
                    min={0}
                    max={remaining}
                    className="h-8 w-24"
                    value={receiveQuantities[row.original.id] ?? ""}
                    onChange={(e) =>
                      handleReceiveQuantityChange(
                        row.original.id,
                        e.target.value,
                      )
                    }
                  />
                );
              },
            }),
          ]
        : []),
    ],
    [
      showReceiveForm,
      receiveQuantities,
      handleReceiveQuantityChange,
    ],
  );

  const table = useServerDataTable({
    columns,
    data: items,
    page: 1,
    pageCount: 1,
    pageSize: items.length || 10,
    rowCount: items.length,
    setPage: () => {},
    setPageSize: () => {},
    sortBy: "itemName",
    sortOrder: "asc",
  });

  const canReceive =
    canManage &&
    orderData &&
    (orderData.status === "ordered" ||
      orderData.status === "partially_received");

  const canMarkOrdered =
    canManage && orderData && orderData.status === "draft";

  const canCancel =
    canManage &&
    orderData &&
    (orderData.status === "draft" || orderData.status === "ordered");

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs
          items={[
            {
              label: "Purchase Orders",
              href: ERP_ROUTES.INVENTORY_PURCHASE_ORDERS,
            },
            {
              label: orderData
                ? `PO ${orderData.orderNumber}`
                : "Purchase Order",
            },
          ]}
        />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {orderData
                ? `PO ${orderData.orderNumber}`
                : "Purchase Order"}
            </h1>
            {orderData ? (
              <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                <span>Vendor: {orderData.vendorName}</span>
                <span>|</span>
                <span>
                  Date:{" "}
                  {new Date(orderData.orderDate).toLocaleDateString()}
                </span>
                {orderData.expectedDeliveryDate ? (
                  <>
                    <span>|</span>
                    <span>
                      Expected:{" "}
                      {new Date(
                        orderData.expectedDeliveryDate,
                      ).toLocaleDateString()}
                    </span>
                  </>
                ) : null}
                <span>|</span>
                <Badge
                  className={
                    PO_STATUS_BADGE_CLASSES[orderData.status] ?? ""
                  }
                >
                  {PURCHASE_ORDER_STATUS_LABELS[orderData.status] ??
                    orderData.status}
                </Badge>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            {canMarkOrdered ? (
              <Button
                size="sm"
                onClick={() => void handleStatusChange("ordered")}
                disabled={statusMutation.isPending}
              >
                Mark as Ordered
              </Button>
            ) : null}
            {canReceive && !showReceiveForm ? (
              <Button
                size="sm"
                onClick={() => setShowReceiveForm(true)}
              >
                <IconPackage className="mr-1 size-4" />
                Receive Goods
              </Button>
            ) : null}
            {canCancel ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => void handleStatusChange("cancelled")}
                disabled={statusMutation.isPending}
              >
                Cancel Order
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {orderData ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">
              {formatAmountFromPaise(orderData.totalAmountInPaise)}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs text-muted-foreground">Created By</p>
            <p className="text-sm font-medium">{orderData.createdByName}</p>
          </div>
          {orderData.notes ? (
            <div className="rounded-lg border bg-card p-4">
              <p className="text-xs text-muted-foreground">Notes</p>
              <p className="text-sm">{orderData.notes}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-lg font-semibold tracking-tight">Order Items</h2>
        <ServerDataTable
          emptyDescription="No items in this purchase order."
          emptyTitle="No items"
          errorTitle="Failed to load order items"
          isLoading={orderQuery.isLoading}
          isError={Boolean(orderQuery.error)}
          errorDescription={
            (orderQuery.error as Error | null | undefined)?.message
          }
          onSearchChange={() => {}}
          searchPlaceholder=""
          searchValue=""
          table={table}
          totalRows={items.length}
          showSearch={false}
        />
      </div>

      {showReceiveForm ? (
        <div className="flex items-center gap-3 border-t pt-4">
          <Button
            onClick={() => void handleReceive()}
            disabled={receiveMutation.isPending}
          >
            {receiveMutation.isPending ? "Receiving..." : "Confirm Receipt"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowReceiveForm(false);
              setReceiveQuantities({});
            }}
            disabled={receiveMutation.isPending}
          >
            Cancel
          </Button>
        </div>
      ) : null}
    </div>
  );
}
