import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function RolesPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "roles:manage");

  return <h1 className="text-2xl font-bold">Roles</h1>;
}
