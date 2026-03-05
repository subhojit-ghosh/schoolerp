import { listInstitutions } from "@/server/institutions/queries";
import { InstitutionList } from "@/components/platform/institution-list";

export default async function InstitutionsPage() {
  const institutions = await listInstitutions();
  return <InstitutionList institutions={institutions} />;
}
