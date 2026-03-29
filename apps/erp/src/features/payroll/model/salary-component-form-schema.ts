import { z } from "zod";

export const salaryComponentFormSchema = z.object({
  name: z.string().trim().min(1, "Component name is required").max(100),
  type: z.enum(["earning", "deduction"], { message: "Select a type" }),
  calculationType: z.enum(["fixed", "percentage"], {
    message: "Select a calculation type",
  }),
  isTaxable: z.boolean().default(true),
  isStatutory: z.boolean().default(false),
  sortOrder: z.coerce.number().int().min(0).default(0),
});

export type SalaryComponentFormValues = z.infer<
  typeof salaryComponentFormSchema
>;

export const SALARY_COMPONENT_DEFAULT_VALUES: SalaryComponentFormValues = {
  name: "",
  type: "earning",
  calculationType: "fixed",
  isTaxable: true,
  isStatutory: false,
  sortOrder: 0,
};
