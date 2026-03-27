import { z } from "zod";

export const messPlanFormSchema = z.object({
  name: z.string().trim().min(1, "Mess plan name is required").max(200),
  monthlyFeeInPaise: z.coerce.number().int().min(0, "Monthly fee is required"),
  description: z.string().max(1000).optional().or(z.literal("")),
});

export type MessPlanFormValues = z.infer<typeof messPlanFormSchema>;

export const MESS_PLAN_DEFAULT_VALUES: MessPlanFormValues = {
  name: "",
  monthlyFeeInPaise: 0,
  description: "",
};
