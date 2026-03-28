import { useParams } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useStaffDetailQuery } from "@/features/staff/api/use-staff";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00`));
}

export function StaffIdCardPage() {
  const { staffId } = useParams();
  const institutionId = useAuthStore(
    (store) => store.session?.activeOrganization?.id,
  );
  const staffQuery = useStaffDetailQuery(institutionId, staffId);
  const staff = staffQuery.data;

  if (staffQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading ID card data...
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Staff data not available.
      </div>
    );
  }

  const profile = staff.profile;

  return (
    <PrintDocumentShell
      backHref={`/staff/${staffId}`}
      subtitle={profile?.employeeId ? `Emp. ID ${profile.employeeId}` : ""}
      title={DOCUMENT_TITLES.STAFF_ID_CARD}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <PrintDetailItem label="Staff Name" value={staff.name} />
          {profile?.employeeId ? (
            <PrintDetailItem
              label="Employee ID"
              value={profile.employeeId}
            />
          ) : null}
          {profile?.designation ? (
            <PrintDetailItem
              label="Designation"
              value={profile.designation}
            />
          ) : null}
          {profile?.department ? (
            <PrintDetailItem
              label="Department"
              value={profile.department}
            />
          ) : null}
          {staff.campusName ? (
            <PrintDetailItem label="Campus" value={staff.campusName} />
          ) : null}
          <PrintDetailItem label="Mobile" value={staff.mobile} />
          {profile?.dateOfJoining ? (
            <PrintDetailItem
              label="Date of Joining"
              value={formatDate(profile.dateOfJoining)}
            />
          ) : null}
        </div>

        <div className="mt-16 flex items-end justify-end pt-8 print:mt-24">
          <div className="text-center">
            <div className="mb-2 h-px w-48 bg-border" />
            <p className="text-xs text-muted-foreground">
              Principal / Head of Institution
            </p>
          </div>
        </div>
      </div>
    </PrintDocumentShell>
  );
}
