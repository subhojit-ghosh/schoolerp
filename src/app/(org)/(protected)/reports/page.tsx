import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function ReportsPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "reports:export");

  return <h1 className="text-2xl font-bold">Reports</h1>;
}
