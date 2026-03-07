import { getCurrentInstitution } from "@/server/institutions/get-current";
import { PageHeader } from "@/components/page-header";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();

  return <PageHeader title={`Welcome to ${institution.name}`} />;
}
