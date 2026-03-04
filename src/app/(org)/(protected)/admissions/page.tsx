import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function AdmissionsPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "admissions:read");

  return <h1 className="text-2xl font-bold">Admissions</h1>;
}
