import { useQueryClient } from "@tanstack/react-query";
import { INVENTORY_API_PATHS } from "@/features/auth/api/auth.constants";
import { apiQueryClient } from "@/lib/api/client";

function invalidateInventoryLists(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LIST_CATEGORIES,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LIST_ITEMS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LIST_TRANSACTIONS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LOW_STOCK,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LIST_VENDORS,
      { params: { query: {} } },
    ).queryKey,
  });
  void queryClient.invalidateQueries({
    queryKey: apiQueryClient.queryOptions(
      "get",
      INVENTORY_API_PATHS.LIST_PURCHASE_ORDERS,
      { params: { query: {} } },
    ).queryKey,
  });
}

// ── Categories ───────────────────────────────────────────────────────────────

export function useCategoriesQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_CATEGORIES,
    { params: { query } },
    { enabled },
  );
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    INVENTORY_API_PATHS.CREATE_CATEGORY,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdateCategoryMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_CATEGORY,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdateCategoryStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_CATEGORY_STATUS,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

// ── Items ────────────────────────────────────────────────────────────────────

export function useItemsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_ITEMS,
    { params: { query } },
    { enabled },
  );
}

export function useItemDetailQuery(enabled: boolean, itemId?: string) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.GET_ITEM,
    { params: { path: { itemId: itemId! } } },
    { enabled: enabled && Boolean(itemId) },
  );
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("post", INVENTORY_API_PATHS.CREATE_ITEM, {
    onSuccess: () => {
      invalidateInventoryLists(queryClient);
    },
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation("patch", INVENTORY_API_PATHS.UPDATE_ITEM, {
    onSuccess: () => {
      invalidateInventoryLists(queryClient);
    },
  });
}

export function useUpdateItemStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_ITEM_STATUS,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

// ── Transactions ─────────────────────────────────────────────────────────────

export function useTransactionsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_TRANSACTIONS,
    { params: { query } },
    { enabled },
  );
}

export function useItemTransactionsQuery(
  enabled: boolean,
  itemId: string,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_ITEM_TRANSACTIONS,
    { params: { path: { itemId }, query } },
    { enabled: enabled && Boolean(itemId) },
  );
}

export function useCreateTransactionMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    INVENTORY_API_PATHS.CREATE_TRANSACTION,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

// ── Vendors ─────────────────────────────────────────────────────────────────

export function useVendorsQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_VENDORS,
    { params: { query } },
    { enabled },
  );
}

export function useCreateVendorMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    INVENTORY_API_PATHS.CREATE_VENDOR,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdateVendorMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_VENDOR,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdateVendorStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_VENDOR_STATUS,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

// ── Purchase Orders ─────────────────────────────────────────────────────────

export function usePurchaseOrdersQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LIST_PURCHASE_ORDERS,
    { params: { query } },
    { enabled },
  );
}

export function useGetPurchaseOrderQuery(
  enabled: boolean,
  orderId?: string,
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.GET_PURCHASE_ORDER,
    { params: { path: { orderId: orderId! } } },
    { enabled: enabled && Boolean(orderId) },
  );
}

export function useCreatePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    INVENTORY_API_PATHS.CREATE_PURCHASE_ORDER,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdatePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_PURCHASE_ORDER,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useUpdatePurchaseOrderStatusMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "patch",
    INVENTORY_API_PATHS.UPDATE_PURCHASE_ORDER_STATUS,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

export function useReceivePurchaseOrderMutation() {
  const queryClient = useQueryClient();
  return apiQueryClient.useMutation(
    "post",
    INVENTORY_API_PATHS.RECEIVE_PURCHASE_ORDER,
    {
      onSuccess: () => {
        invalidateInventoryLists(queryClient);
      },
    },
  );
}

// ── Low Stock ────────────────────────────────────────────────────────────────

export function useLowStockQuery(
  enabled: boolean,
  query: Record<string, unknown> = {},
) {
  return apiQueryClient.useQuery(
    "get",
    INVENTORY_API_PATHS.LOW_STOCK,
    { params: { query } },
    { enabled },
  );
}
