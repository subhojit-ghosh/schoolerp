import { getCurrentInstitution } from "@/server/institutions/get-current";
import { PageShell } from "@/components/page-shell";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();

  return <PageShell title={`Welcome to ${institution.name}`} />;
}
