import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { SORT_ORDERS, TABLE_PAGE_SIZES, type OrgStatus } from "../../constants";

const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZES[0];

export const sortableInstitutionColumns = {
  name: "name",
  slug: "slug",
  createdAt: "createdAt",
} as const;

export type SortableInstitutionColumn = keyof typeof sortableInstitutionColumns;

export const listInstitutionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum([
    sortableInstitutionColumns.name,
    sortableInstitutionColumns.slug,
    sortableInstitutionColumns.createdAt,
  ]).optional(),
  order: z.enum([SORT_ORDERS.ASC, SORT_ORDERS.DESC]).optional(),
});

export type ListInstitutionsQuery = z.infer<typeof listInstitutionsQuerySchema>;

export type InstitutionDto = {
  id: string;
  name: string;
  slug: string;
  institutionType: string | null;
  status: OrgStatus | null;
  createdAt: Date;
};

export type InstitutionCountsDto = {
  total: number;
  active: number;
  suspended: number;
};

export type ListInstitutionsResultDto = {
  rows: InstitutionDto[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export function parseListInstitutionsQuery(
  value: Record<string, unknown>,
): ListInstitutionsQuery {
  const result = listInstitutionsQuerySchema.safeParse({
    page: value.page,
    limit: value.limit,
    search: value.q ?? value.search,
    sort: value.sort,
    order: value.order,
  });

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function resolveInstitutionPageSize(limit?: number) {
  return TABLE_PAGE_SIZES.includes(limit as (typeof TABLE_PAGE_SIZES)[number])
    ? limit!
    : DEFAULT_PAGE_SIZE;
}
