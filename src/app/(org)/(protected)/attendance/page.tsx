import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS } from "@/constants";
import { PageHeader } from "@/components/page-header";

export default async function AttendancePage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.ATTENDANCE.READ);

  return <PageHeader title="Attendance" />;
}
