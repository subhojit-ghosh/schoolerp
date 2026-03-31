import { z } from "zod";
import { consentPurposeSchema } from "@repo/contracts";
import {
  baseListQuerySchema,
  parseListQuerySchema,
  type BaseListQuery,
} from "../../lib/list-query";

// ── Consent schemas ─────────────────────────────────────────────────────

export const grantConsentSchema = z.object({
  purpose: consentPurposeSchema,
});

export type GrantConsentInput = z.infer<typeof grantConsentSchema>;

export function parseGrantConsent(body: unknown): GrantConsentInput {
  return parseListQuerySchema(grantConsentSchema, body);
}

export const withdrawConsentParamSchema = z.object({
  purpose: consentPurposeSchema,
});

export function parseWithdrawConsentParam(param: unknown) {
  return parseListQuerySchema(withdrawConsentParamSchema, param);
}

// ── Sensitive access log query ──────────────────────────────────────────

export const sortableSensitiveAccessColumns = {
  createdAt: "createdAt",
  dataType: "dataType",
  action: "action",
} as const;

export const listSensitiveAccessQuerySchema = baseListQuerySchema.extend({
  sort: z
    .enum([
      sortableSensitiveAccessColumns.createdAt,
      sortableSensitiveAccessColumns.dataType,
      sortableSensitiveAccessColumns.action,
    ])
    .optional(),
  dataType: z.string().trim().min(1).optional(),
  entityType: z.string().trim().min(1).optional(),
  accessedByUserId: z.uuid().optional(),
});

export type ListSensitiveAccessQuery = BaseListQuery & {
  sort?: keyof typeof sortableSensitiveAccessColumns;
  dataType?: string;
  entityType?: string;
  accessedByUserId?: string;
};

export function parseListSensitiveAccessQuery(
  query: unknown,
): ListSensitiveAccessQuery {
  const parsed = parseListQuerySchema(listSensitiveAccessQuerySchema, query);

  return {
    page: parsed.page,
    limit: parsed.limit,
    search: parsed.q,
    sort: parsed.sort,
    order: parsed.order,
    dataType: parsed.dataType,
    entityType: parsed.entityType,
    accessedByUserId: parsed.accessedByUserId,
  };
}

// ── Session config ──────────────────────────────────────────────────────

const MIN_CONCURRENT_SESSIONS = 1;
const MAX_CONCURRENT_SESSIONS = 10;
const MIN_SESSION_TIMEOUT_MINUTES = 5;
const MAX_SESSION_TIMEOUT_MINUTES = 480;

export const updateSessionConfigSchema = z.object({
  maxConcurrentSessions: z.coerce
    .number()
    .int()
    .min(MIN_CONCURRENT_SESSIONS)
    .max(MAX_CONCURRENT_SESSIONS)
    .optional(),
  sessionTimeoutMinutes: z.coerce
    .number()
    .int()
    .min(MIN_SESSION_TIMEOUT_MINUTES)
    .max(MAX_SESSION_TIMEOUT_MINUTES)
    .optional(),
  requireReauthForSensitiveOps: z.boolean().optional(),
});

export type UpdateSessionConfigInput = z.infer<
  typeof updateSessionConfigSchema
>;

export function parseUpdateSessionConfig(
  body: unknown,
): UpdateSessionConfigInput {
  return parseListQuerySchema(updateSessionConfigSchema, body);
}
