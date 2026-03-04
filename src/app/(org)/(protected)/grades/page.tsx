import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function GradesPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "grades:read");

  return <h1 className="text-2xl font-bold">Grades</h1>;
}
