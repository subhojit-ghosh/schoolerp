import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  baseListQuerySchema,
  parseListQuerySchema,
} from "../../lib/list-query";

export const createCampusSchema = z.object({
  name: z.string().trim().min(1, "Campus name is required"),
  slug: z.string().trim().optional(),
  code: z.string().trim().optional(),
  isDefault: z.boolean().optional(),
});

export const sortableCampusColumns = {
  default: "default",
  name: "name",
  slug: "slug",
  status: "status",
} as const;

export const listCampusesQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableCampusColumns.default,
      sortableCampusColumns.name,
      sortableCampusColumns.slug,
      sortableCampusColumns.status,
    ])
    .optional(),
});

export type CreateCampusDto = z.infer<typeof createCampusSchema>;
type ListCampusesQueryInput = z.infer<typeof listCampusesQuerySchema>;
export type ListCampusesQueryDto = Omit<ListCampusesQueryInput, "q"> & {
  search?: string;
};

export function parseCreateCampus(value: unknown) {
  const result = createCampusSchema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseListCampusesQuery(query: unknown): ListCampusesQueryDto {
  const result = parseListQuerySchema(listCampusesQuerySchema, query);

  return {
    limit: result.limit,
    order: result.order,
    page: result.page,
    search: result.q,
    sort: result.sort,
  };
}
