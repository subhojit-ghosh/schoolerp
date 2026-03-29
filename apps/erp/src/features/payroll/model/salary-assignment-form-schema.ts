import { z } from "zod";

export const salaryAssignmentFormSchema = z.object({
  staffProfileId: z.string().min(1, "Select a staff member"),
  salaryTemplateId: z.string().min(1, "Select a salary template"),
  effectiveFrom: z.string().min(1, "Enter an effective date"),
});

export type SalaryAssignmentFormValues = z.infer<
  typeof salaryAssignmentFormSchema
>;

export const SALARY_ASSIGNMENT_DEFAULT_VALUES: SalaryAssignmentFormValues = {
  staffProfileId: "",
  salaryTemplateId: "",
  effectiveFrom: "",
};
