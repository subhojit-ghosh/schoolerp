export const CATEGORY_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const ITEM_LIST_SORT_FIELDS = {
  NAME: "name",
  CURRENT_STOCK: "currentStock",
  CREATED_AT: "createdAt",
} as const;

export const TRANSACTION_LIST_SORT_FIELDS = {
  CREATED_AT: "createdAt",
  QUANTITY: "quantity",
} as const;

export const LOW_STOCK_LIST_SORT_FIELDS = {
  NAME: "name",
  CURRENT_STOCK: "currentStock",
  CREATED_AT: "createdAt",
} as const;

export const CATEGORIES_PAGE_COPY = {
  TITLE: "Item Categories",
  DESCRIPTION: "Organize inventory items into categories.",
  EMPTY_TITLE: "No categories yet",
  EMPTY_DESCRIPTION: "Create a category to start organizing inventory items.",
  SEARCH_PLACEHOLDER: "Search categories...",
} as const;

export const ITEMS_PAGE_COPY = {
  TITLE: "Inventory Items",
  DESCRIPTION: "Track school supplies, equipment, and other physical assets.",
  EMPTY_TITLE: "No items yet",
  EMPTY_DESCRIPTION: "Create an inventory item to start tracking stock.",
  SEARCH_PLACEHOLDER: "Search items...",
} as const;

export const TRANSACTIONS_PAGE_COPY = {
  TITLE: "Stock Transactions",
  DESCRIPTION: "View all stock movements across inventory items.",
  EMPTY_TITLE: "No transactions yet",
  EMPTY_DESCRIPTION:
    "Stock transactions will appear here when items are purchased, issued, or returned.",
  SEARCH_PLACEHOLDER: "Search transactions...",
} as const;

export const LOW_STOCK_PAGE_COPY = {
  TITLE: "Low Stock",
  DESCRIPTION: "Items where current stock is at or below minimum stock level.",
  EMPTY_TITLE: "No low stock items",
  EMPTY_DESCRIPTION: "All items are above their minimum stock levels.",
  SEARCH_PLACEHOLDER: "Search items...",
} as const;

export const INVENTORY_UNIT_LABELS: Record<string, string> = {
  piece: "Piece",
  box: "Box",
  pack: "Pack",
  set: "Set",
  kg: "Kg",
  liter: "Liter",
} as const;

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  purchase: "Purchase",
  issue: "Issue",
  return: "Return",
  adjustment: "Adjustment",
} as const;
