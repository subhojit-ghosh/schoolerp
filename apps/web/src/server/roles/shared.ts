import { ROLE_TYPES } from "@/constants";

export type PermissionOption = {
  id: string;
  slug: string;
  description: string | null;
};

export type RoleRow = {
  id: string;
  name: string;
  slug: string;
  roleType: string;
  institutionId: string | null;
  isSystem: boolean;
  isConfigurable: boolean;
  permissionIds: string[];
  permissionSlugs: string[];
  activeMemberCount: number;
};

export function isEditableInstitutionRole(
  role: Pick<RoleRow, "institutionId" | "roleType">,
) {
  return role.institutionId !== null && role.roleType === ROLE_TYPES.STAFF;
}
