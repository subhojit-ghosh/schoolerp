import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(200),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const CATEGORY_DEFAULT_VALUES: CategoryFormValues = {
  name: "",
  description: "",
};
