import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { DATABASE } from "@repo/backend-core";
import { ConflictException, Inject, Injectable } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  campus,
  count,
  desc,
  eq,
  ilike,
  ne,
  or,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import { AuditService } from "../audit/audit.service";
import { slugifyValue } from "../auth/auth.utils";
import type { AuthenticatedSession } from "../auth/auth.types";
import type { CampusDto } from "./campuses.dto";
import type { CreateCampusDto, ListCampusesQueryDto } from "./campuses.schemas";
import { sortableCampusColumns } from "./campuses.schemas";

type CampusRecord = CampusDto;

const sortableColumns = {
  default: campus.isDefault,
  name: campus.name,
  slug: campus.slug,
  status: campus.status,
} as const;

@Injectable()
export class CampusesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listCampuses(
    organizationId: string,
    authSession: AuthenticatedSession,
    query: ListCampusesQueryDto = {},
  ): Promise<PaginatedResult<CampusDto>> {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableCampusColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(campus.organizationId, organizationId),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    if (query.search) {
      conditions.push(
        or(
          ilike(campus.name, `%${query.search}%`),
          ilike(campus.slug, `%${query.search}%`),
          ilike(campus.code, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(campus)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select(this.campusSelect)
      .from(campus)
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        desc(campus.isDefault),
        asc(campus.name),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => this.toCampusDto(row)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createCampus(
    organizationId: string,
    authSession: AuthenticatedSession,
    payload: CreateCampusDto,
  ) {
    const nextSlug = slugifyValue(payload.slug ?? payload.name);

    await this.assertCampusSlugAvailable(organizationId, nextSlug);

    const existingCampuses =
      await this.listCampusesForOrganization(organizationId);
    const nextIsDefault = payload.isDefault ?? existingCampuses.length === 0;

    if (nextIsDefault) {
      await this.db
        .update(campus)
        .set({ isDefault: false })
        .where(eq(campus.organizationId, organizationId));
    }

    const [createdCampus] = await this.db
      .insert(campus)
      .values({
        id: randomUUID(),
        organizationId,
        name: payload.name.trim(),
        slug: nextSlug,
        code: payload.code ?? null,
        isDefault: nextIsDefault,
        status: STATUS.CAMPUS.ACTIVE,
      })
      .returning({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        isDefault: campus.isDefault,
        status: campus.status,
      });

    this.auditService
      .record({
        institutionId: organizationId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.CAMPUS,
        entityId: createdCampus.id,
        entityLabel: createdCampus.name,
        summary: `Created campus ${createdCampus.name}.`,
      })
      .catch(() => {});

    return createdCampus;
  }

  private async assertCampusSlugAvailable(
    organizationId: string,
    slug: string,
  ) {
    const [existingCampus] = await this.db
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          eq(campus.slug, slug),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (existingCampus) {
      throw new ConflictException(ERROR_MESSAGES.ONBOARDING.CAMPUS_SLUG_EXISTS);
    }
  }

  private readonly campusSelect = {
    id: campus.id,
    organizationId: campus.organizationId,
    name: campus.name,
    slug: campus.slug,
    code: campus.code,
    isDefault: campus.isDefault,
    status: campus.status,
  };

  private toCampusDto(row: CampusRecord): CampusDto {
    return row;
  }

  private listCampusesForOrganization(organizationId: string) {
    return this.db
      .select(this.campusSelect)
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .orderBy(desc(campus.isDefault), asc(campus.name));
  }
}
