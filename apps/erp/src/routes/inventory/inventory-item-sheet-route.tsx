import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateItemMutation,
  useItemsQuery,
  useUpdateItemMutation,
  useCategoriesQuery,
} from "@/features/inventory/api/use-inventory";
import {
  ITEM_DEFAULT_VALUES,
  type ItemFormValues,
} from "@/features/inventory/model/item-form-schema";
import { ItemForm } from "@/features/inventory/ui/item-form";
import { appendSearch } from "@/lib/routes";

type InventoryItemSheetRouteProps = {
  mode: "create" | "edit";
};

export function InventoryItemSheetRoute({ mode }: InventoryItemSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const itemsQuery = useItemsQuery(mode === "edit" && isEnabled);
  const categoriesQuery = useCategoriesQuery(isEnabled, { limit: 100, status: "active" });
  const createMutation = useCreateItemMutation();
  const updateMutation = useUpdateItemMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.INVENTORY_ITEMS, location.search),
    [location.search],
  );

  const categoriesData = categoriesQuery.data;
  const categoryOptions = useMemo(
    () =>
      ((categoriesData?.rows ?? []) as Array<{ id: string; name: string }>),
    [categoriesData?.rows],
  );

  const rows = (itemsQuery.data as { rows?: unknown[] } | undefined)?.rows ?? itemsQuery.data;
  const editingItem = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === itemId)
    : undefined;

  const defaultValues = useMemo<ItemFormValues>(() => {
    if (mode === "create" || !editingItem) {
      return ITEM_DEFAULT_VALUES;
    }
    return {
      name: editingItem.name as string,
      categoryId: editingItem.categoryId as string,
      sku: (editingItem.sku as string) ?? "",
      unit: (editingItem.unit as ItemFormValues["unit"]) ?? "piece",
      minimumStock: (editingItem.minimumStock as number) ?? 0,
      location: (editingItem.location as string) ?? "",
      purchasePriceInPaise: (editingItem.purchasePriceInPaise as number | undefined) ?? undefined,
    };
  }, [editingItem, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: ItemFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          name: values.name,
          categoryId: values.categoryId,
          sku: values.sku || undefined,
          unit: values.unit,
          minimumStock: values.minimumStock,
          location: values.location || undefined,
          purchasePriceInPaise: values.purchasePriceInPaise,
        },
      });
      toast.success("Item created.");
      void navigate(closeTo);
    } else if (itemId) {
      await updateMutation.mutateAsync({
        params: { path: { itemId } },
        body: {
          name: values.name,
          categoryId: values.categoryId,
          sku: values.sku || null,
          unit: values.unit,
          minimumStock: values.minimumStock,
          location: values.location || null,
          purchasePriceInPaise: values.purchasePriceInPaise ?? null,
        },
      });
      toast.success("Item updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New item" : "Edit item";
  const description =
    mode === "create"
      ? "Add a new inventory item."
      : (editingItem?.name as string) ?? "Edit this item.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <ItemForm
        categories={categoryOptions}
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create item" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
