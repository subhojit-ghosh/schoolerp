import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import {
  salaryComponentTypeSchema,
  salaryCalculationTypeSchema,
  salaryComponentStatusSchema,
  salaryTemplateStatusSchema,
  salaryAssignmentStatusSchema,
} from "@repo/contracts";

// ── Salary Components ─────────────────────────────────────────────────────

export const createSalaryComponentSchema = z.object({
  name: z.string().min(1).max(100),
  type: salaryComponentTypeSchema,
  calculationType: salaryCalculationTypeSchema,
  isTaxable: z.boolean().default(true),
  isStatutory: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const updateSalaryComponentSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  type: salaryComponentTypeSchema.optional(),
  calculationType: salaryCalculationTypeSchema.optional(),
  isTaxable: z.boolean().optional(),
  isStatutory: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const updateSalaryComponentStatusSchema = z.object({
  status: z.enum(["active", "archived"]),
});

export const listSalaryComponentsQuerySchema = z.object({
  q: z.string().optional(),
  status: salaryComponentStatusSchema.optional(),
  type: salaryComponentTypeSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "type", "sortOrder", "createdAt"]).default("sortOrder"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Salary Templates ──────────────────────────────────────────────────────

const templateComponentSchema = z.object({
  salaryComponentId: z.uuid(),
  amountInPaise: z.number().int().min(0).optional().nullable(),
  percentage: z.number().int().min(0).optional().nullable(),
  sortOrder: z.number().int().min(0).default(0),
});

export const createSalaryTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  components: z.array(templateComponentSchema).min(1),
});

export const updateSalaryTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional().nullable(),
  components: z.array(templateComponentSchema).min(1).optional(),
});

export const updateSalaryTemplateStatusSchema = z.object({
  status: z.enum(["active", "archived"]),
});

export const listSalaryTemplatesQuerySchema = z.object({
  q: z.string().optional(),
  status: salaryTemplateStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["name", "createdAt"]).default("name"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Salary Assignments ────────────────────────────────────────────────────

const overrideEntrySchema = z.object({
  amountInPaise: z.number().int().min(0).optional().nullable(),
  percentage: z.number().int().min(0).optional().nullable(),
});

export const createSalaryAssignmentSchema = z.object({
  staffProfileId: z.uuid(),
  salaryTemplateId: z.uuid(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  overrides: z.record(z.string(), overrideEntrySchema).optional(),
});

export const updateSalaryAssignmentSchema = z.object({
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format").optional(),
  overrides: z.record(z.string(), overrideEntrySchema).optional().nullable(),
});

export const updateSalaryAssignmentStatusSchema = z.object({
  status: z.enum(["active", "archived"]),
});

export const listSalaryAssignmentsQuerySchema = z.object({
  q: z.string().optional(),
  status: salaryAssignmentStatusSchema.optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["staffName", "effectiveFrom", "ctcInPaise", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Payroll Runs ──────────────────────────────────────────────────────────

export const createPayrollRunSchema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  campusId: z.uuid().optional().nullable(),
  workingDays: z.number().int().min(1).max(31).default(26),
});

export const listPayrollRunsQuerySchema = z.object({
  q: z.string().optional(),
  year: z.coerce.number().int().optional(),
  status: z.enum(["draft", "processed", "approved", "paid"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["month", "year", "status", "createdAt"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

// ── Payslips ──────────────────────────────────────────────────────────────

export const listPayslipsQuerySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
  sort: z.enum(["staffName", "netPayInPaise", "createdAt"]).default("staffName"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

// ── Reports ───────────────────────────────────────────────────────────────

export const monthlySummaryQuerySchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
});

export const staffHistoryQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

// ── Types ─────────────────────────────────────────────────────────────────

export type CreateSalaryComponentDto = z.infer<typeof createSalaryComponentSchema>;
export type UpdateSalaryComponentDto = z.infer<typeof updateSalaryComponentSchema>;
export type UpdateSalaryComponentStatusDto = z.infer<typeof updateSalaryComponentStatusSchema>;
export type ListSalaryComponentsQueryDto = z.infer<typeof listSalaryComponentsQuerySchema>;
export type CreateSalaryTemplateDto = z.infer<typeof createSalaryTemplateSchema>;
export type UpdateSalaryTemplateDto = z.infer<typeof updateSalaryTemplateSchema>;
export type UpdateSalaryTemplateStatusDto = z.infer<typeof updateSalaryTemplateStatusSchema>;
export type ListSalaryTemplatesQueryDto = z.infer<typeof listSalaryTemplatesQuerySchema>;
export type CreateSalaryAssignmentDto = z.infer<typeof createSalaryAssignmentSchema>;
export type UpdateSalaryAssignmentDto = z.infer<typeof updateSalaryAssignmentSchema>;
export type UpdateSalaryAssignmentStatusDto = z.infer<typeof updateSalaryAssignmentStatusSchema>;
export type ListSalaryAssignmentsQueryDto = z.infer<typeof listSalaryAssignmentsQuerySchema>;
export type CreatePayrollRunDto = z.infer<typeof createPayrollRunSchema>;
export type ListPayrollRunsQueryDto = z.infer<typeof listPayrollRunsQuerySchema>;
export type ListPayslipsQueryDto = z.infer<typeof listPayslipsQuerySchema>;
export type MonthlySummaryQueryDto = z.infer<typeof monthlySummaryQuerySchema>;
export type StaffHistoryQueryDto = z.infer<typeof staffHistoryQuerySchema>;

// ── Parse helpers ─────────────────────────────────────────────────────────

function parseOrBadRequest<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }
  return result.data;
}

export function parseCreateSalaryComponent(input: unknown) {
  return parseOrBadRequest(createSalaryComponentSchema, input);
}
export function parseUpdateSalaryComponent(input: unknown) {
  return parseOrBadRequest(updateSalaryComponentSchema, input);
}
export function parseUpdateSalaryComponentStatus(input: unknown) {
  return parseOrBadRequest(updateSalaryComponentStatusSchema, input);
}
export function parseListSalaryComponents(input: unknown) {
  return parseOrBadRequest(listSalaryComponentsQuerySchema, input);
}
export function parseCreateSalaryTemplate(input: unknown) {
  return parseOrBadRequest(createSalaryTemplateSchema, input);
}
export function parseUpdateSalaryTemplate(input: unknown) {
  return parseOrBadRequest(updateSalaryTemplateSchema, input);
}
export function parseUpdateSalaryTemplateStatus(input: unknown) {
  return parseOrBadRequest(updateSalaryTemplateStatusSchema, input);
}
export function parseListSalaryTemplates(input: unknown) {
  return parseOrBadRequest(listSalaryTemplatesQuerySchema, input);
}
export function parseCreateSalaryAssignment(input: unknown) {
  return parseOrBadRequest(createSalaryAssignmentSchema, input);
}
export function parseUpdateSalaryAssignment(input: unknown) {
  return parseOrBadRequest(updateSalaryAssignmentSchema, input);
}
export function parseUpdateSalaryAssignmentStatus(input: unknown) {
  return parseOrBadRequest(updateSalaryAssignmentStatusSchema, input);
}
export function parseListSalaryAssignments(input: unknown) {
  return parseOrBadRequest(listSalaryAssignmentsQuerySchema, input);
}
export function parseCreatePayrollRun(input: unknown) {
  return parseOrBadRequest(createPayrollRunSchema, input);
}
export function parseListPayrollRuns(input: unknown) {
  return parseOrBadRequest(listPayrollRunsQuerySchema, input);
}
export function parseListPayslips(input: unknown) {
  return parseOrBadRequest(listPayslipsQuerySchema, input);
}
export function parseMonthlySummary(input: unknown) {
  return parseOrBadRequest(monthlySummaryQuerySchema, input);
}
export function parseStaffHistory(input: unknown) {
  return parseOrBadRequest(staffHistoryQuerySchema, input);
}
