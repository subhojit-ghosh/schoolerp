import { z } from "zod";
import type { CreateRoleBodyDto, UpdateRoleBodyDto } from "./roles.dto";

export const createRoleSchema = z.object({
  name: z.string().min(1).max(100),
  permissionIds: z.array(z.uuid()).min(1),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  permissionIds: z.array(z.uuid()).optional(),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;

export function parseCreateRole(body: CreateRoleBodyDto): CreateRoleDto {
  return createRoleSchema.parse(body);
}

export function parseUpdateRole(body: UpdateRoleBodyDto): UpdateRoleDto {
  return updateRoleSchema.parse(body);
}
