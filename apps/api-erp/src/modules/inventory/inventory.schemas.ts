import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  inventoryCategoryStatusSchema,
  inventoryItemStatusSchema,
  stockTransactionTypeSchema,
  inventoryUnitSchema,
  vendorStatusSchema,
  purchaseOrderStatusSchema,
} from "@repo/contracts";

// ── Categories ───────────────────────────────────────────────────────────────

export const createCategorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
});

export const updateCategoryStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listCategoriesQuerySchema = z.object({
  q: z.string().optional(),
  status: inventoryCategoryStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Items ────────────────────────────────────────────────────────────────────

export const createItemSchema = z.object({
  name: z.string().min(1).max(200),
  categoryId: z.uuid(),
  sku: z.string().max(100).optional(),
  unit: inventoryUnitSchema.default("piece"),
  minimumStock: z.number().int().min(0).default(0),
  location: z.string().max(500).optional(),
  purchasePriceInPaise: z.number().int().min(0).optional(),
});

export const updateItemSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  categoryId: z.uuid().optional(),
  sku: z.string().max(100).optional().nullable(),
  unit: inventoryUnitSchema.optional(),
  minimumStock: z.number().int().min(0).optional(),
  location: z.string().max(500).optional().nullable(),
  purchasePriceInPaise: z.number().int().min(0).optional().nullable(),
});

export const updateItemStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listItemsQuerySchema = z.object({
  q: z.string().optional(),
  campusId: z.string().optional(),
  status: inventoryItemStatusSchema.optional(),
  categoryId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "currentStock", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Stock Transactions ───────────────────────────────────────────────────────

export const createStockTransactionSchema = z.object({
  itemId: z.uuid(),
  transactionType: stockTransactionTypeSchema,
  quantity: z.number().int().positive(),
  referenceNumber: z.string().max(200).optional(),
  issuedToMembershipId: z.uuid().optional(),
  departmentName: z.string().max(200).optional(),
  purchaseOrderId: z.uuid().optional(),
  unitPriceInPaise: z.number().int().min(0).optional(),
  notes: z.string().max(1000).optional(),
});

export const listTransactionsQuerySchema = z.object({
  q: z.string().optional(),
  campusId: z.string().optional(),
  transactionType: stockTransactionTypeSchema.optional(),
  itemId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["createdAt", "quantity"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listItemTransactionsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["createdAt", "quantity"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const listLowStockQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "currentStock", "createdAt"]).default("currentStock"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Vendors ─────────────────────────────────────────────────────────────────

export const createVendorSchema = z.object({
  name: z.string().min(1).max(200),
  contactPerson: z.string().max(200).optional(),
  phone: z.string().max(20).optional(),
  email: z.email().optional(),
  address: z.string().max(1000).optional(),
  gstNumber: z.string().max(50).optional(),
});

export const updateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  contactPerson: z.string().max(200).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  email: z.email().optional().nullable(),
  address: z.string().max(1000).optional().nullable(),
  gstNumber: z.string().max(50).optional().nullable(),
});

export const updateVendorStatusSchema = z.object({
  status: z.enum(["active", "inactive"]),
});

export const listVendorsQuerySchema = z.object({
  q: z.string().optional(),
  status: vendorStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Purchase Orders ─────────────────────────────────────────────────────────

const purchaseOrderItemSchema = z.object({
  itemId: z.uuid(),
  quantityOrdered: z.number().int().positive(),
  unitPriceInPaise: z.number().int().min(0),
});

export const createPurchaseOrderSchema = z.object({
  vendorId: z.uuid(),
  orderNumber: z.string().min(1).max(100),
  orderDate: z.string().min(1),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(purchaseOrderItemSchema).min(1),
});

export const updatePurchaseOrderSchema = z.object({
  vendorId: z.uuid().optional(),
  orderNumber: z.string().min(1).max(100).optional(),
  orderDate: z.string().min(1).optional(),
  expectedDeliveryDate: z.string().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  items: z.array(purchaseOrderItemSchema).min(1).optional(),
});

export const updatePurchaseOrderStatusSchema = z.object({
  status: purchaseOrderStatusSchema,
});

export const listPurchaseOrdersQuerySchema = z.object({
  q: z.string().optional(),
  status: purchaseOrderStatusSchema.optional(),
  vendorId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["orderDate", "createdAt", "orderNumber"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Receive (GRN) ───────────────────────────────────────────────────────────

const receiveLineSchema = z.object({
  purchaseOrderItemId: z.uuid(),
  quantityReceived: z.number().int().positive(),
});

export const receivePurchaseOrderSchema = z.object({
  lines: z.array(receiveLineSchema).min(1),
  notes: z.string().max(2000).optional(),
});

// ── Types ────────────────────────────────────────────────────────────────────

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
export type UpdateCategoryStatusDto = z.infer<
  typeof updateCategoryStatusSchema
>;
export type ListCategoriesQueryDto = z.infer<typeof listCategoriesQuerySchema>;
export type CreateItemDto = z.infer<typeof createItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type UpdateItemStatusDto = z.infer<typeof updateItemStatusSchema>;
export type ListItemsQueryDto = z.infer<typeof listItemsQuerySchema>;
export type CreateStockTransactionDto = z.infer<
  typeof createStockTransactionSchema
>;
export type ListTransactionsQueryDto = z.infer<
  typeof listTransactionsQuerySchema
>;
export type ListItemTransactionsQueryDto = z.infer<
  typeof listItemTransactionsQuerySchema
>;
export type ListLowStockQueryDto = z.infer<typeof listLowStockQuerySchema>;
export type CreateVendorDto = z.infer<typeof createVendorSchema>;
export type UpdateVendorDto = z.infer<typeof updateVendorSchema>;
export type UpdateVendorStatusDto = z.infer<typeof updateVendorStatusSchema>;
export type ListVendorsQueryDto = z.infer<typeof listVendorsQuerySchema>;
export type CreatePurchaseOrderDto = z.infer<typeof createPurchaseOrderSchema>;
export type UpdatePurchaseOrderDto = z.infer<typeof updatePurchaseOrderSchema>;
export type UpdatePurchaseOrderStatusDto = z.infer<
  typeof updatePurchaseOrderStatusSchema
>;
export type ListPurchaseOrdersQueryDto = z.infer<
  typeof listPurchaseOrdersQuerySchema
>;
export type ReceivePurchaseOrderDto = z.infer<
  typeof receivePurchaseOrderSchema
>;

// ── Parse helpers ────────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateCategory(input: unknown) {
  return parseOrBadRequest(createCategorySchema, input);
}
export function parseUpdateCategory(input: unknown) {
  return parseOrBadRequest(updateCategorySchema, input);
}
export function parseUpdateCategoryStatus(input: unknown) {
  return parseOrBadRequest(updateCategoryStatusSchema, input);
}
export function parseListCategories(input: unknown) {
  return parseOrBadRequest(listCategoriesQuerySchema, input);
}
export function parseCreateItem(input: unknown) {
  return parseOrBadRequest(createItemSchema, input);
}
export function parseUpdateItem(input: unknown) {
  return parseOrBadRequest(updateItemSchema, input);
}
export function parseUpdateItemStatus(input: unknown) {
  return parseOrBadRequest(updateItemStatusSchema, input);
}
export function parseListItems(input: unknown) {
  return parseOrBadRequest(listItemsQuerySchema, input);
}
export function parseCreateStockTransaction(input: unknown) {
  return parseOrBadRequest(createStockTransactionSchema, input);
}
export function parseListTransactions(input: unknown) {
  return parseOrBadRequest(listTransactionsQuerySchema, input);
}
export function parseListItemTransactions(input: unknown) {
  return parseOrBadRequest(listItemTransactionsQuerySchema, input);
}
export function parseListLowStock(input: unknown) {
  return parseOrBadRequest(listLowStockQuerySchema, input);
}
export function parseCreateVendor(input: unknown) {
  return parseOrBadRequest(createVendorSchema, input);
}
export function parseUpdateVendor(input: unknown) {
  return parseOrBadRequest(updateVendorSchema, input);
}
export function parseUpdateVendorStatus(input: unknown) {
  return parseOrBadRequest(updateVendorStatusSchema, input);
}
export function parseListVendors(input: unknown) {
  return parseOrBadRequest(listVendorsQuerySchema, input);
}
export function parseCreatePurchaseOrder(input: unknown) {
  return parseOrBadRequest(createPurchaseOrderSchema, input);
}
export function parseUpdatePurchaseOrder(input: unknown) {
  return parseOrBadRequest(updatePurchaseOrderSchema, input);
}
export function parseUpdatePurchaseOrderStatus(input: unknown) {
  return parseOrBadRequest(updatePurchaseOrderStatusSchema, input);
}
export function parseListPurchaseOrders(input: unknown) {
  return parseOrBadRequest(listPurchaseOrdersQuerySchema, input);
}
export function parseReceivePurchaseOrder(input: unknown) {
  return parseOrBadRequest(receivePurchaseOrderSchema, input);
}
