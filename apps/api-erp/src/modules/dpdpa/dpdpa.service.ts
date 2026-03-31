import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  count,
  dataConsents,
  desc,
  eq,
  ilike,
  institutionSessionConfig,
  or,
  sensitiveDataAccessLogs,
  user,
  type AppDatabase,
  type SQL,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  CONSENT_STATUS,
  type ConsentPurpose,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import type {
  ListSensitiveAccessQuery,
  UpdateSessionConfigInput,
} from "./dpdpa.schemas";
import { sortableSensitiveAccessColumns } from "./dpdpa.schemas";

// ── Data masking utilities ──────────────────────────────────────────────

const AADHAR_VISIBLE_DIGITS = 4;
const MOBILE_VISIBLE_DIGITS = 5;

export function maskAadhar(value: string): string {
  const digits = value.replace(/\D/g, "");
  const visible = digits.slice(-AADHAR_VISIBLE_DIGITS);

  return `XXXX XXXX ${visible}`;
}

export function maskMobile(value: string): string {
  const digits = value.replace(/\D/g, "");
  const visible = digits.slice(-MOBILE_VISIBLE_DIGITS);

  return `XXXXX-${visible}`;
}

export function maskEmail(value: string): string {
  const [local, domain] = value.split("@");

  if (!local || !domain) {
    return "***@***";
  }

  const firstChar = local.charAt(0);

  return `${firstChar}***@${domain}`;
}

// ── Service ─────────────────────────────────────────────────────────────

@Injectable()
export class DpdpaService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Consents ────────────────────────────────────────────────────────

  async listConsents(institutionId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(dataConsents)
      .where(
        and(
          eq(dataConsents.institutionId, institutionId),
          eq(dataConsents.userId, userId),
        ),
      )
      .orderBy(asc(dataConsents.purpose));

    return rows.map((row) => this.formatConsent(row));
  }

  async grantConsent(
    institutionId: string,
    userId: string,
    purpose: ConsentPurpose,
    ipAddress: string | null,
    authSession: AuthenticatedSession,
  ) {
    const existing = await this.findConsent(institutionId, userId, purpose);

    if (existing && existing.status === CONSENT_STATUS.GRANTED) {
      return this.formatConsent(existing);
    }

    if (existing) {
      const [updated] = await this.db
        .update(dataConsents)
        .set({
          status: CONSENT_STATUS.GRANTED,
          consentedAt: new Date(),
          withdrawnAt: null,
          ipAddress,
        })
        .where(eq(dataConsents.id, existing.id))
        .returning();

      this.auditConsent(
        institutionId,
        authSession,
        AUDIT_ACTIONS.UPDATE,
        updated.id,
        purpose,
        "Re-granted consent.",
      );

      return this.formatConsent(updated);
    }

    const [created] = await this.db
      .insert(dataConsents)
      .values({
        id: randomUUID(),
        institutionId,
        userId,
        purpose,
        status: CONSENT_STATUS.GRANTED,
        ipAddress,
      })
      .returning();

    this.auditConsent(
      institutionId,
      authSession,
      AUDIT_ACTIONS.CREATE,
      created.id,
      purpose,
      "Granted consent.",
    );

    return this.formatConsent(created);
  }

  async withdrawConsent(
    institutionId: string,
    userId: string,
    purpose: ConsentPurpose,
    ipAddress: string | null,
    authSession: AuthenticatedSession,
  ) {
    const existing = await this.findConsent(institutionId, userId, purpose);

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.DPDPA.CONSENT_NOT_FOUND);
    }

    if (existing.status === CONSENT_STATUS.WITHDRAWN) {
      return this.formatConsent(existing);
    }

    const [updated] = await this.db
      .update(dataConsents)
      .set({
        status: CONSENT_STATUS.WITHDRAWN,
        withdrawnAt: new Date(),
        ipAddress,
      })
      .where(eq(dataConsents.id, existing.id))
      .returning();

    this.auditConsent(
      institutionId,
      authSession,
      AUDIT_ACTIONS.UPDATE,
      updated.id,
      purpose,
      "Withdrew consent.",
    );

    return this.formatConsent(updated);
  }

  // ── Sensitive data access logging ───────────────────────────────────

  async logSensitiveAccess(
    institutionId: string,
    accessedByUserId: string,
    dataType: string,
    entityType: string,
    entityId: string,
    action: string,
    ipAddress: string | null,
  ) {
    await this.db.insert(sensitiveDataAccessLogs).values({
      id: randomUUID(),
      institutionId,
      accessedByUserId,
      dataType,
      entityType,
      entityId,
      action,
      ipAddress,
    });
  }

  async listAccessLogs(institutionId: string, query: ListSensitiveAccessQuery) {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableSensitiveAccessColumns.createdAt;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;
    const conditions: SQL[] = [
      eq(sensitiveDataAccessLogs.institutionId, institutionId),
    ];

    if (query.dataType) {
      conditions.push(eq(sensitiveDataAccessLogs.dataType, query.dataType));
    }

    if (query.entityType) {
      conditions.push(eq(sensitiveDataAccessLogs.entityType, query.entityType));
    }

    if (query.accessedByUserId) {
      conditions.push(
        eq(sensitiveDataAccessLogs.accessedByUserId, query.accessedByUserId),
      );
    }

    if (query.search) {
      conditions.push(
        or(
          ilike(sensitiveDataAccessLogs.dataType, `%${query.search}%`),
          ilike(sensitiveDataAccessLogs.action, `%${query.search}%`),
          ilike(user.name, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(sensitiveDataAccessLogs)
      .innerJoin(user, eq(sensitiveDataAccessLogs.accessedByUserId, user.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const sortableColumns = {
      [sortableSensitiveAccessColumns.createdAt]:
        sensitiveDataAccessLogs.createdAt,
      [sortableSensitiveAccessColumns.dataType]:
        sensitiveDataAccessLogs.dataType,
      [sortableSensitiveAccessColumns.action]: sensitiveDataAccessLogs.action,
    };

    const rows = await this.db
      .select({
        id: sensitiveDataAccessLogs.id,
        institutionId: sensitiveDataAccessLogs.institutionId,
        accessedByUserId: sensitiveDataAccessLogs.accessedByUserId,
        accessedByName: user.name,
        dataType: sensitiveDataAccessLogs.dataType,
        entityType: sensitiveDataAccessLogs.entityType,
        entityId: sensitiveDataAccessLogs.entityId,
        action: sensitiveDataAccessLogs.action,
        ipAddress: sensitiveDataAccessLogs.ipAddress,
        createdAt: sensitiveDataAccessLogs.createdAt,
      })
      .from(sensitiveDataAccessLogs)
      .innerJoin(user, eq(sensitiveDataAccessLogs.accessedByUserId, user.id))
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        desc(sensitiveDataAccessLogs.createdAt),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => ({
        ...row,
        ipAddress: row.ipAddress ?? null,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  // ── Session config ──────────────────────────────────────────────────

  async getSessionConfig(institutionId: string) {
    const [config] = await this.db
      .select()
      .from(institutionSessionConfig)
      .where(eq(institutionSessionConfig.institutionId, institutionId))
      .limit(1);

    if (!config) {
      // Return defaults if no config exists
      return {
        id: null,
        institutionId,
        maxConcurrentSessions: 3,
        sessionTimeoutMinutes: 30,
        requireReauthForSensitiveOps: true,
        createdAt: null,
        updatedAt: null,
      };
    }

    return this.formatSessionConfig(config);
  }

  async updateSessionConfig(
    institutionId: string,
    input: UpdateSessionConfigInput,
    authSession: AuthenticatedSession,
  ) {
    const existing = await this.db
      .select()
      .from(institutionSessionConfig)
      .where(eq(institutionSessionConfig.institutionId, institutionId))
      .limit(1);

    let record: typeof institutionSessionConfig.$inferSelect;

    if (existing.length === 0) {
      const [created] = await this.db
        .insert(institutionSessionConfig)
        .values({
          id: randomUUID(),
          institutionId,
          maxConcurrentSessions: input.maxConcurrentSessions ?? 3,
          sessionTimeoutMinutes: input.sessionTimeoutMinutes ?? 30,
          requireReauthForSensitiveOps:
            input.requireReauthForSensitiveOps ?? true,
        })
        .returning();

      record = created!;
    } else {
      const updateSet: Record<string, unknown> = {};

      if (input.maxConcurrentSessions !== undefined) {
        updateSet.maxConcurrentSessions = input.maxConcurrentSessions;
      }

      if (input.sessionTimeoutMinutes !== undefined) {
        updateSet.sessionTimeoutMinutes = input.sessionTimeoutMinutes;
      }

      if (input.requireReauthForSensitiveOps !== undefined) {
        updateSet.requireReauthForSensitiveOps =
          input.requireReauthForSensitiveOps;
      }

      const [updated] = await this.db
        .update(institutionSessionConfig)
        .set(updateSet)
        .where(eq(institutionSessionConfig.institutionId, institutionId))
        .returning();

      record = updated!;
    }

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.SENSITIVE_DATA_ACCESS,
        entityId: record.id,
        entityLabel: "Session config",
        summary: "Updated institution session configuration.",
      })
      .catch(() => {});

    return this.formatSessionConfig(record);
  }

  // ── Private helpers ─────────────────────────────────────────────────

  private async findConsent(
    institutionId: string,
    userId: string,
    purpose: string,
  ) {
    const [row] = await this.db
      .select()
      .from(dataConsents)
      .where(
        and(
          eq(dataConsents.institutionId, institutionId),
          eq(dataConsents.userId, userId),
          eq(dataConsents.purpose, purpose),
        ),
      )
      .limit(1);

    return row ?? null;
  }

  private auditConsent(
    institutionId: string,
    authSession: AuthenticatedSession,
    action: typeof AUDIT_ACTIONS.CREATE | typeof AUDIT_ACTIONS.UPDATE,
    entityId: string,
    purpose: string,
    summary: string,
  ) {
    this.auditService
      .record({
        institutionId,
        authSession,
        action,
        entityType: AUDIT_ENTITY_TYPES.DATA_CONSENT,
        entityId,
        entityLabel: purpose,
        summary,
      })
      .catch(() => {});
  }

  private formatConsent(row: typeof dataConsents.$inferSelect) {
    return {
      id: row.id,
      institutionId: row.institutionId,
      userId: row.userId,
      purpose: row.purpose,
      status: row.status,
      consentedAt: row.consentedAt.toISOString(),
      withdrawnAt: row.withdrawnAt?.toISOString() ?? null,
      ipAddress: row.ipAddress ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private formatSessionConfig(
    row: typeof institutionSessionConfig.$inferSelect,
  ) {
    return {
      id: row.id,
      institutionId: row.institutionId,
      maxConcurrentSessions: row.maxConcurrentSessions,
      sessionTimeoutMinutes: row.sessionTimeoutMinutes,
      requireReauthForSensitiveOps: row.requireReauthForSensitiveOps,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
