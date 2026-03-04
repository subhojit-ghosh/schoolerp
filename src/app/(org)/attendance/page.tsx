import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";

export default async function AttendancePage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, "attendance:read");

  return <h1 className="text-2xl font-bold">Attendance</h1>;
}
