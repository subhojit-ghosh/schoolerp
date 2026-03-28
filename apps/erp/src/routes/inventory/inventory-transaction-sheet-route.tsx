import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateTransactionMutation,
  useItemsQuery,
} from "@/features/inventory/api/use-inventory";
import {
  TRANSACTION_DEFAULT_VALUES,
  type TransactionFormValues,
} from "@/features/inventory/model/transaction-form-schema";
import { TransactionForm } from "@/features/inventory/ui/transaction-form";
import { appendSearch } from "@/lib/routes";

export function InventoryTransactionSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const itemsQuery = useItemsQuery(isEnabled, { limit: 200, status: "active" });
  const createMutation = useCreateTransactionMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.INVENTORY_TRANSACTIONS, location.search),
    [location.search],
  );

  const itemsData = itemsQuery.data;
  const itemOptions = useMemo(
    () =>
      ((itemsData?.rows ?? []) as Array<{ id: string; name: string }>),
    [itemsData?.rows],
  );

  const isPending = createMutation.isPending;
  const errorMessage = (createMutation.error as Error | null | undefined)?.message ?? undefined;

  async function handleSubmit(values: TransactionFormValues) {
    try {
      await createMutation.mutateAsync({
        body: {
          itemId: values.itemId,
          transactionType: values.transactionType,
          quantity: values.quantity,
          referenceNumber: values.referenceNumber || undefined,
          issuedToMembershipId: values.issuedToMembershipId || undefined,
          notes: values.notes || undefined,
        },
      });
      toast.success("Stock transaction recorded.");
      void navigate(closeTo);
    } catch (error) {
      toast.error(extractApiError(error, "Could not record stock transaction. Please try again."));
    }
  }

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description="Record a stock movement."
      title="New Transaction"
    >
      <TransactionForm
        items={itemOptions}
        defaultValues={TRANSACTION_DEFAULT_VALUES}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel="Create transaction"
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
