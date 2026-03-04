import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function MembersPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "members:invite");

  return <h1 className="text-2xl font-bold">Members</h1>;
}
