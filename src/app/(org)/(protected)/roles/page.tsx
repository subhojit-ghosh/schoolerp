import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS } from "@/constants";
import { RolesContent } from "@/components/org/roles-content";
import {
  listPermissionOptions,
  listRolesForInstitution,
} from "@/server/roles/queries";

export default async function RolesPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.ROLES.MANAGE);

  const [roles, permissionOptions] = await Promise.all([
    listRolesForInstitution(institution.id),
    listPermissionOptions(),
  ]);

  return <RolesContent roles={roles} permissionOptions={permissionOptions} />;
}
