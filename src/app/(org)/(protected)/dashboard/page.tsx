import { getCurrentInstitution } from "@/server/institutions/get-current";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to {institution.name}</h1>
      <p className="text-muted-foreground mt-1">
        Select a module from the sidebar to get started.
      </p>
    </div>
  );
}
