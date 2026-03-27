import { z } from "zod";

export const payrollRunFormSchema = z.object({
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2000).max(2100),
  campusId: z.string().optional().or(z.literal("")),
  workingDays: z.coerce.number().int().min(1).max(31).default(26),
});

export type PayrollRunFormValues = z.infer<typeof payrollRunFormSchema>;

export const PAYROLL_RUN_DEFAULT_VALUES: PayrollRunFormValues = {
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  campusId: "",
  workingDays: 26,
};
