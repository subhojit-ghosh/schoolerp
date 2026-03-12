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
  q: z.string().trim().min(1).optional(),
  sort: z
    .enum([
      sortableInstitutionColumns.name,
      sortableInstitutionColumns.slug,
      sortableInstitutionColumns.createdAt,
    ])
    .optional(),
  order: z.enum([SORT_ORDERS.ASC, SORT_ORDERS.DESC]).optional(),
});

type ListInstitutionsQueryInput = z.infer<typeof listInstitutionsQuerySchema>;

export type ListInstitutionsQuery = Omit<ListInstitutionsQueryInput, "q"> & {
  search?: string;
};

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
  value: Record<string, unknown> | ListInstitutionsQueryInput,
): ListInstitutionsQuery {
  const result = listInstitutionsQuerySchema.safeParse({
    page: value.page,
    limit: value.limit,
    q: value.q,
    sort: value.sort,
    order: value.order,
  });

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return {
    search: result.data.q,
    page: result.data.page,
    limit: result.data.limit,
    sort: result.data.sort,
    order: result.data.order,
  };
}

const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
const NAME_MAX_LENGTH = 200;
const URL_MAX_LENGTH = 2048;
const FONT_FAMILY_MAX_LENGTH = 100;

export const updateBrandingSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(NAME_MAX_LENGTH),
  shortName: z
    .string()
    .trim()
    .min(1, "Short name is required")
    .max(NAME_MAX_LENGTH),
  logoUrl: z.string().trim().max(URL_MAX_LENGTH).optional(),
  faviconUrl: z.string().trim().max(URL_MAX_LENGTH).optional(),
  primaryColor: z
    .string()
    .regex(HEX_COLOR_REGEX, "Must be a valid 6-digit hex color, e.g. #8a5a44"),
  accentColor: z
    .string()
    .regex(HEX_COLOR_REGEX, "Must be a valid 6-digit hex color, e.g. #d59f6a"),
  sidebarColor: z
    .string()
    .regex(HEX_COLOR_REGEX, "Must be a valid 6-digit hex color, e.g. #32241c"),
  fontHeading: z.string().trim().max(FONT_FAMILY_MAX_LENGTH).optional(),
  fontBody: z.string().trim().max(FONT_FAMILY_MAX_LENGTH).optional(),
  fontMono: z.string().trim().max(FONT_FAMILY_MAX_LENGTH).optional(),
  borderRadius: z.enum(["sharp", "default", "rounded", "pill"]).optional(),
  uiDensity: z.enum(["compact", "default", "comfortable"]).optional(),
});

export type UpdateBranding = z.infer<typeof updateBrandingSchema>;

export function parseUpdateBranding(value: unknown): UpdateBranding {
  const result = updateBrandingSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function resolveInstitutionPageSize(limit?: number) {
  if (limit === undefined) {
    return DEFAULT_PAGE_SIZE;
  }

  return TABLE_PAGE_SIZES.some((pageSize) => pageSize === limit)
    ? limit
    : DEFAULT_PAGE_SIZE;
}
