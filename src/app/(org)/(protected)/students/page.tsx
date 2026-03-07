import { getCurrentInstitution } from "@/server/institutions/get-current";
import { requireOrgAccess, assertPermission } from "@/server/auth/require-org-access";
import { PERMISSIONS } from "@/constants";
import { PageHeader } from "@/components/page-header";

export default async function StudentsPage() {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);
  assertPermission(org, PERMISSIONS.STUDENTS.READ);

  return <PageHeader title="Students" />;
}
