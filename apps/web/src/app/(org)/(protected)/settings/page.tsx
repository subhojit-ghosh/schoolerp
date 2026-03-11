import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS } from "@/constants";
import { SettingsContent } from "@/components/org/settings-content";
import { listAcademicYears } from "@/server/academic-years/queries";

export default async function SettingsPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.SETTINGS.READ);

  const academicYears = await listAcademicYears(institution.id);
  const canManage = org.isSuperAdmin || org.permissionSet.has(PERMISSIONS.SETTINGS.WRITE);

  return <SettingsContent academicYears={academicYears} canManage={canManage} />;
}
