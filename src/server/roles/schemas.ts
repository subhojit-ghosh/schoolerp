import { z } from "zod";
import { ERROR_MESSAGES, ROLE_TYPES } from "@/constants";

export const createRoleSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  permissionIds: z.array(z.string()).min(1, ERROR_MESSAGES.ROLES.PERMISSION_REQUIRED),
});

export const updateRolePermissionsSchema = z.object({
  roleId: z.uuid(),
  permissionIds: z.array(z.string()).min(1, ERROR_MESSAGES.ROLES.PERMISSION_REQUIRED),
});

export const roleIdSchema = z.object({
  roleId: z.uuid(),
});

export const CUSTOM_ROLE_TYPE = ROLE_TYPES.STAFF;

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRolePermissionsInput = z.infer<typeof updateRolePermissionsSchema>;

