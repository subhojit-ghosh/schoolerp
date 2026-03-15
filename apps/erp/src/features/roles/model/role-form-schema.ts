import { z } from "zod";

export const roleFormSchema = z.object({
  name: z.string().trim().min(1, "Role name is required").max(100),
  permissionIds: z.array(z.string()).min(1, "Select at least one permission"),
});

export type RoleFormValues = z.infer<typeof roleFormSchema>;
