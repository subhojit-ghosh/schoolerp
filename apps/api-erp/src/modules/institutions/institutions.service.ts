import { DATABASE } from "@repo/backend-core";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  isNull,
  sql,
  type SQL,
} from "drizzle-orm";
import { organization } from "@repo/database";
import { STATUS, SORT_ORDERS } from "../../constants";
import { resolvePagination } from "../../lib/list-query";
import {
  resolveInstitutionPageSize,
  sortableInstitutionColumns,
  type ListInstitutionsQuery,
  type SortableInstitutionColumn,
  type UpdateBranding,
} from "./institutions.schemas";
import {
  InstitutionCountsDto,
  InstitutionDto,
  ListInstitutionsResultDto,
  UpdateBrandingResponseDto,
} from "./institutions.dto";

const sortableColumns = {
  name: organization.name,
  slug: organization.slug,
  createdAt: organization.createdAt,
} as const;

@Injectable()
export class InstitutionsService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listInstitutions(
    params: ListInstitutionsQuery = {},
  ): Promise<ListInstitutionsResultDto> {
    const pageSize = resolveInstitutionPageSize(params.limit);
    const page = Math.max(1, params.page ?? 1);
    const sortKey: SortableInstitutionColumn =
      params.sort ?? sortableInstitutionColumns.createdAt;
    const sortOrder = params.order === SORT_ORDERS.ASC ? asc : desc;

    const conditions: SQL[] = [isNull(organization.deletedAt)];

    if (params.search) {
      conditions.push(ilike(organization.name, `%${params.search}%`));
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(organization)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        institutionType: organization.institutionType,
        status: organization.status,
        createdAt: organization.createdAt,
      })
      .from(organization)
      .where(where)
      .orderBy(sortOrder(sortableColumns[sortKey]))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async countInstitutionsByStatus(): Promise<InstitutionCountsDto> {
    const [row] = await this.db
      .select({
        total: count(),
        active: count(
          sql`CASE WHEN ${organization.status} = ${STATUS.ORG.ACTIVE} THEN 1 END`,
        ),
        suspended: count(
          sql`CASE WHEN ${organization.status} = ${STATUS.ORG.SUSPENDED} THEN 1 END`,
        ),
      })
      .from(organization)
      .where(isNull(organization.deletedAt));

    return {
      total: row?.total ?? 0,
      active: row?.active ?? 0,
      suspended: row?.suspended ?? 0,
    };
  }

  async updateBranding(
    id: string,
    data: UpdateBranding,
  ): Promise<UpdateBrandingResponseDto> {
    const [updated] = await this.db
      .update(organization)
      .set({
        name: data.name,
        shortName: data.shortName,
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        sidebarColor: data.sidebarColor,
        fontHeading: data.fontHeading ?? null,
        fontBody: data.fontBody ?? null,
        fontMono: data.fontMono ?? null,
        borderRadius: data.borderRadius ?? null,
        uiDensity: data.uiDensity ?? null,
      })
      .where(eq(organization.id, id))
      .returning({
        name: organization.name,
        shortName: organization.shortName,
        logoUrl: organization.logoUrl,
        faviconUrl: organization.faviconUrl,
        primaryColor: organization.primaryColor,
        accentColor: organization.accentColor,
        sidebarColor: organization.sidebarColor,
        fontHeading: organization.fontHeading,
        fontBody: organization.fontBody,
        fontMono: organization.fontMono,
        borderRadius: organization.borderRadius,
        uiDensity: organization.uiDensity,
      });

    if (!updated) {
      throw new NotFoundException("Institution not found");
    }

    return updated;
  }

  async getInstitutionById(id: string): Promise<InstitutionDto | null> {
    const [row] = await this.db
      .select({
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
        institutionType: organization.institutionType,
        status: organization.status,
        createdAt: organization.createdAt,
        deletedAt: organization.deletedAt,
      })
      .from(organization)
      .where(eq(organization.id, id))
      .limit(1);

    if (!row || row.deletedAt !== null) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      institutionType: row.institutionType,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
