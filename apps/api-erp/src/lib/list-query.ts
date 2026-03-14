import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { SORT_ORDERS, TABLE_PAGE_SIZES } from "../constants";

const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZES[1];

export const baseListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  q: z.string().trim().min(1).optional(),
  order: z.enum([SORT_ORDERS.ASC, SORT_ORDERS.DESC]).optional(),
});

export type BaseListQueryInput = z.infer<typeof baseListQuerySchema>;

export type BaseListQuery = Omit<BaseListQueryInput, "q"> & {
  search?: string;
};

export type PaginatedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function parseListQuerySchema<T>(schema: z.ZodType<T>, value: unknown) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function resolveTablePageSize(limit?: number) {
  if (limit === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  return TABLE_PAGE_SIZES.some((pageSize) => pageSize === limit)
    ? limit
    : DEFAULT_PAGE_SIZE;
}

export function resolvePagination(
  total: number,
  page: number | undefined,
  pageSize: number,
) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page ?? 1), pageCount);

  return {
    page: safePage,
    pageCount,
    offset: (safePage - 1) * pageSize,
  };
}
