import { getCurrentInstitution } from "@/server/institutions/get-current";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold tracking-tight">
        Welcome to {institution.name}
      </h1>
    </div>
  );
}
