import { BadRequestException } from "@nestjs/common";
import { z } from "zod";

export const createLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
  isPaid: z.boolean().default(true),
});

export const updateLeaveTypeSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  maxDaysPerYear: z.number().int().positive().optional().nullable(),
  isPaid: z.boolean().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export const listLeaveTypesQuerySchema = z.object({
  status: z.enum(["active", "inactive"]).optional(),
});

export const createLeaveApplicationSchema = z
  .object({
    leaveTypeId: z.uuid(),
    fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
    reason: z.string().max(2000).optional(),
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "From date must be on or before to date.",
    path: ["toDate"],
  });

export const reviewLeaveApplicationSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().max(2000).optional(),
});

export const listLeaveApplicationsQuerySchema = z.object({
  q: z.string().optional(),
  staffMemberId: z.string().optional(),
  leaveTypeId: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected", "cancelled"]).optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["fromDate", "createdAt", "status"]).default("fromDate"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type CreateLeaveTypeDto = z.infer<typeof createLeaveTypeSchema>;
export type UpdateLeaveTypeDto = z.infer<typeof updateLeaveTypeSchema>;
export type CreateLeaveApplicationDto = z.infer<
  typeof createLeaveApplicationSchema
>;
export type ReviewLeaveApplicationDto = z.infer<
  typeof reviewLeaveApplicationSchema
>;
export type ListLeaveApplicationsQueryDto = z.infer<
  typeof listLeaveApplicationsQuerySchema
>;

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateLeaveType(input: unknown) {
  return parseOrBadRequest(createLeaveTypeSchema, input);
}

export function parseUpdateLeaveType(input: unknown) {
  return parseOrBadRequest(updateLeaveTypeSchema, input);
}

export function parseListLeaveTypes(input: unknown) {
  return parseOrBadRequest(listLeaveTypesQuerySchema, input);
}

export function parseCreateLeaveApplication(input: unknown) {
  return parseOrBadRequest(createLeaveApplicationSchema, input);
}

export function parseReviewLeaveApplication(input: unknown) {
  return parseOrBadRequest(reviewLeaveApplicationSchema, input);
}

export function parseListLeaveApplications(input: unknown) {
  return parseOrBadRequest(listLeaveApplicationsQuerySchema, input);
}
