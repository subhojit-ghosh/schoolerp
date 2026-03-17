import { z } from "zod";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  type AuditAction,
  type AuditEntityType,
  type AuthContextKey,
} from "@repo/contracts";
import {
  baseListQuerySchema,
  parseListQuerySchema,
  type BaseListQuery,
} from "../../lib/list-query";
import type { ListAuditLogsQueryDto } from "./audit.dto";

export const sortableAuditLogColumns = {
  createdAt: "createdAt",
  action: "action",
  entityType: "entityType",
  actor: "actor",
} as const;

export const listAuditLogsQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableAuditLogColumns.createdAt,
      sortableAuditLogColumns.action,
      sortableAuditLogColumns.entityType,
      sortableAuditLogColumns.actor,
    ])
    .optional(),
  action: z
    .enum([
      AUDIT_ACTIONS.CREATE,
      AUDIT_ACTIONS.UPDATE,
      AUDIT_ACTIONS.DELETE,
      AUDIT_ACTIONS.MARK,
      AUDIT_ACTIONS.REPLACE,
      AUDIT_ACTIONS.REVERSE,
      AUDIT_ACTIONS.EXECUTE,
    ])
    .optional(),
  entityType: z
    .enum([
      AUDIT_ENTITY_TYPES.ROLE,
      AUDIT_ENTITY_TYPES.ATTENDANCE_DAY,
      AUDIT_ENTITY_TYPES.EXAM_MARKS,
      AUDIT_ENTITY_TYPES.FEE_PAYMENT,
      AUDIT_ENTITY_TYPES.STUDENT_ROLLOVER,
    ])
    .optional(),
  actorUserId: z.uuid().optional(),
});

export type ListAuditLogsQuery = BaseListQuery & {
  sort?: keyof typeof sortableAuditLogColumns;
  action?: AuditAction;
  entityType?: AuditEntityType;
  actorUserId?: string;
};

export type RecordAuditLogInput = {
  institutionId: string;
  authSession: {
    user: {
      id: string;
    };
    activeCampusId: string | null;
    activeContextKey: AuthContextKey | null;
  };
  action: AuditAction;
  entityType: AuditEntityType;
  entityId?: string | null;
  entityLabel?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

export function parseListAuditLogsQuery(
  query: ListAuditLogsQueryDto,
): ListAuditLogsQuery {
  const parsed = parseListQuerySchema(listAuditLogsQuerySchema, query);

  return {
    page: parsed.page,
    limit: parsed.limit,
    search: parsed.q,
    sort: parsed.sort,
    order: parsed.order,
    action: parsed.action,
    entityType: parsed.entityType,
    actorUserId: parsed.actorUserId,
  };
}
