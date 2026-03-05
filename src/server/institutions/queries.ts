import "server-only";
import { db } from "@/db";
import { organization } from "@/db/schema/auth";
import { eq, isNull, desc, asc, count, sql, ilike, and, type SQL } from "drizzle-orm";
import { STATUS, type OrgStatus } from "@/constants";

export type InstitutionRow = {
  id: string;
  name: string;
  slug: string;
  institutionType: string | null;
  status: OrgStatus | null;
  createdAt: Date;
};

const DEFAULT_PAGE_SIZE = 10;
const ALLOWED_PAGE_SIZES = [10, 20, 50] as const;

const sortableColumns = {
  name: organization.name,
  slug: organization.slug,
  createdAt: organization.createdAt,
} as const;

type SortableColumn = keyof typeof sortableColumns;

export type ListInstitutionsParams = {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
};

export type ListInstitutionsResult = {
  rows: InstitutionRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listInstitutions(
  params: ListInstitutionsParams = {},
): Promise<ListInstitutionsResult> {
  const pageSize = ALLOWED_PAGE_SIZES.includes(params.limit as typeof ALLOWED_PAGE_SIZES[number])
    ? params.limit!
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const sortKey = (params.sort && params.sort in sortableColumns
    ? params.sort
    : "createdAt") as SortableColumn;
  const sortOrder = params.order === "asc" ? asc : desc;

  const conditions: SQL[] = [isNull(organization.deletedAt)];

  if (params.search) {
    conditions.push(ilike(organization.name, `%${params.search}%`));
  }

  const where = and(...conditions)!;

  const [totalRow] = await db
    .select({ count: count() })
    .from(organization)
    .where(where);

  const total = totalRow?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
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

  return { rows, total, page: safePage, pageSize, pageCount };
}

export type InstitutionCounts = {
  total: number;
  active: number;
  suspended: number;
};

export async function countInstitutionsByStatus(): Promise<InstitutionCounts> {
  const [row] = await db
    .select({
      total: count(),
      active: count(sql`CASE WHEN ${organization.status} = ${STATUS.ORG.ACTIVE} THEN 1 END`),
      suspended: count(sql`CASE WHEN ${organization.status} = ${STATUS.ORG.SUSPENDED} THEN 1 END`),
    })
    .from(organization)
    .where(isNull(organization.deletedAt));

  return {
    total: row?.total ?? 0,
    active: row?.active ?? 0,
    suspended: row?.suspended ?? 0,
  };
}

export async function getInstitutionById(id: string): Promise<InstitutionRow | null> {
  const [row] = await db
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

  if (!row || row.deletedAt !== null) return null;

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    institutionType: row.institutionType,
    status: row.status,
    createdAt: row.createdAt,
  };
}
