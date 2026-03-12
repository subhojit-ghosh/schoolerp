import { DATABASE } from "@academic-platform/backend-core";
import { Inject, Injectable } from "@nestjs/common";
import type { AppDatabase } from "@academic-platform/database";
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
import { organization } from "@academic-platform/database";
import { STATUS, SORT_ORDERS } from "../../constants";
import {
  resolveInstitutionPageSize,
  sortableInstitutionColumns,
  type ListInstitutionsQuery,
  type SortableInstitutionColumn,
} from "./institutions.schemas";
import {
  InstitutionCountsDto,
  InstitutionDto,
  ListInstitutionsResultDto,
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
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, pageCount);

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
      .offset((safePage - 1) * pageSize);

    return {
      rows: rows.map((row) => ({
        ...row,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page: safePage,
      pageSize,
      pageCount,
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
