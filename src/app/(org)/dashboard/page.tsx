import { getCurrentInstitution } from "@/server/auth/get-current-institution";
import { requireOrgAccess } from "@/server/auth/require-org-access";

export default async function DashboardPage() {
  const institution = await getCurrentInstitution();
  await requireOrgAccess(institution); // Validates membership, 2FA, and academic year

  return (
    <div>
      <h1 className="text-2xl font-bold">Welcome to {institution.name}</h1>
      <p className="text-muted-foreground mt-1">Select a module from the sidebar to get started.</p>
    </div>
  );
}
