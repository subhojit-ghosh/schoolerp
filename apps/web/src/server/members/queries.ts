import "server-only";
import { and, asc, count, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { member, user } from "@/db/schema/auth";
import { membershipRoles, roles } from "@/db/schema";
import { ROLE_TYPES, ROLES, SORT_ORDERS, TABLE_PAGE_SIZES, type MemberStatus } from "@/constants";

export type MemberRoleOption = {
  id: string;
  name: string;
  slug: string;
};

export type MemberRow = {
  memberId: string;
  userId: string;
  name: string;
  email: string;
  status: MemberStatus;
  roleId: string | null;
  roleName: string | null;
  roleSlug: string | null;
  createdAt: Date;
};

const DEFAULT_PAGE_SIZE = TABLE_PAGE_SIZES[0];
const ALLOWED_PAGE_SIZES = TABLE_PAGE_SIZES;

const sortableColumns = {
  name: user.name,
  email: user.email,
  status: member.status,
  createdAt: member.createdAt,
} as const;

type SortableColumn = keyof typeof sortableColumns;

export type ListMembersParams = {
  institutionId: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
};

export type ListMembersResult = {
  rows: MemberRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

export async function listMembers(
  params: ListMembersParams,
): Promise<ListMembersResult> {
  const pageSize = ALLOWED_PAGE_SIZES.includes(params.limit as typeof ALLOWED_PAGE_SIZES[number])
    ? params.limit!
    : DEFAULT_PAGE_SIZE;
  const page = Math.max(1, params.page ?? 1);
  const sortKey = (params.sort && params.sort in sortableColumns
    ? params.sort
    : "createdAt") as SortableColumn;
  const sortOrder = params.order === SORT_ORDERS.ASC ? asc : desc;

  const conditions: SQL[] = [
    eq(member.organizationId, params.institutionId),
    isNull(member.deletedAt),
  ];

  if (params.search) {
    conditions.push(
      or(
        ilike(user.name, `%${params.search}%`),
        ilike(user.email, `%${params.search}%`),
      )!,
    );
  }

  const where = and(...conditions)!;

  const [totalRow] = await db
    .select({ count: count() })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(where);

  const total = totalRow?.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

  const rows = await db
    .select({
      memberId: member.id,
      userId: user.id,
      name: user.name,
      email: user.email,
      status: member.status,
      roleId: roles.id,
      roleName: roles.name,
      roleSlug: roles.slug,
      createdAt: member.createdAt,
    })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .leftJoin(
      membershipRoles,
      and(
        eq(membershipRoles.membershipId, member.id),
        isNull(membershipRoles.validTo),
        isNull(membershipRoles.deletedAt),
      ),
    )
    .leftJoin(roles, eq(roles.id, membershipRoles.roleId))
    .where(where)
    .orderBy(sortOrder(sortableColumns[sortKey]), asc(user.name))
    .limit(pageSize)
    .offset((safePage - 1) * pageSize);

  return {
    rows: rows.map((row) => ({
      ...row,
      status: row.status as MemberStatus,
    })),
    total,
    page: safePage,
    pageSize,
    pageCount,
  };
}

export async function listAssignableMemberRoles(
  institutionId: string,
): Promise<MemberRoleOption[]> {
  return db
    .select({
      id: roles.id,
      name: roles.name,
      slug: roles.slug,
    })
    .from(roles)
    .where(
      and(
        or(isNull(roles.institutionId), eq(roles.institutionId, institutionId))!,
        or(eq(roles.roleType, ROLE_TYPES.SYSTEM), eq(roles.roleType, ROLE_TYPES.STAFF))!,
        isNull(roles.deletedAt),
      ),
    )
    .orderBy(asc(roles.name))
    .then((rows) => rows.filter((row) => row.slug !== ROLES.SUPER_ADMIN));
}
