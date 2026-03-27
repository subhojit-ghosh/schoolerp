import { z } from "zod";

const templateComponentSchema = z.object({
  salaryComponentId: z.string().min(1, "Select a component"),
  amountInPaise: z.coerce.number().int().min(0).optional().nullable(),
  percentage: z.coerce.number().int().min(0).optional().nullable(),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export const salaryTemplateFormSchema = z.object({
  name: z.string().trim().min(1, "Template name is required").max(200),
  description: z.string().trim().optional().or(z.literal("")),
  components: z.array(templateComponentSchema).min(1, "Add at least one component"),
});

export type SalaryTemplateFormValues = z.infer<typeof salaryTemplateFormSchema>;
export type TemplateComponentFormValues = z.infer<typeof templateComponentSchema>;

export const SALARY_TEMPLATE_DEFAULT_VALUES: SalaryTemplateFormValues = {
  name: "",
  description: "",
  components: [],
};
