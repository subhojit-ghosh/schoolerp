import { BadRequestException } from "@nestjs/common";
import {
  broadcastTargetTypeSchema,
  broadcastPrioritySchema,
} from "@repo/contracts";
import { z } from "zod";

// ── Broadcasts ──────────────────────────────────────────────────────────────

export const createBroadcastSchema = z.object({
  title: z.string().min(1).max(500),
  message: z.string().min(1).max(5000),
  templateKey: z.string().max(100).optional(),
  targetType: broadcastTargetTypeSchema,
  targetId: z.uuid().optional(),
  priority: broadcastPrioritySchema.default("normal"),
  channels: z.array(z.enum(["sms", "email", "in_app"])).min(1),
});

export const updateBroadcastSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  message: z.string().min(1).max(5000).optional(),
  templateKey: z.string().max(100).optional().nullable(),
  targetType: broadcastTargetTypeSchema.optional(),
  targetId: z.uuid().optional().nullable(),
  priority: broadcastPrioritySchema.optional(),
  channels: z.array(z.enum(["sms", "email", "in_app"])).min(1).optional(),
});

export const listBroadcastsQuerySchema = z.object({
  q: z.string().optional(),
  status: z.enum(["draft", "sending", "sent", "failed"]).optional(),
  priority: broadcastPrioritySchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["createdAt", "sentAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Types ───────────────────────────────────────────────────────────────────

export type CreateBroadcastDto = z.infer<typeof createBroadcastSchema>;
export type UpdateBroadcastDto = z.infer<typeof updateBroadcastSchema>;
export type ListBroadcastsQueryDto = z.infer<typeof listBroadcastsQuerySchema>;

// ── Parse helpers ───────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateBroadcast(input: unknown) {
  return parseOrBadRequest(createBroadcastSchema, input);
}
export function parseUpdateBroadcast(input: unknown) {
  return parseOrBadRequest(updateBroadcastSchema, input);
}
export function parseListBroadcastsQuery(input: unknown) {
  return parseOrBadRequest(listBroadcastsQuerySchema, input);
}
