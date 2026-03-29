import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  inventoryCategoryStatusSchema,
  inventoryItemStatusSchema,
  stockTransactionTypeSchema,
  inventoryUnitSchema,
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
  notes: z.string().max(1000).optional(),
});

export const listTransactionsQuerySchema = z.object({
  q: z.string().optional(),
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
