import { useParams } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useStudentSummaryQuery } from "@/features/students/api/use-students";

export function StudentIdCardPage() {
  const { studentId } = useParams();
  const institutionId = useAuthStore(
    (store) => store.session?.activeOrganization?.id,
  );
  const summaryQuery = useStudentSummaryQuery(institutionId, studentId);
  const student = summaryQuery.data?.student;

  if (summaryQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading ID card data...
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Student data not available.
      </div>
    );
  }

  const primaryGuardian = student.guardians?.find(
    (g: { isPrimary: boolean }) => g.isPrimary,
  ) ?? student.guardians?.[0];

  return (
    <PrintDocumentShell
      backHref={`/students/${studentId}`}
      subtitle={student.admissionNumber ? `Adm. No. ${student.admissionNumber}` : ""}
      title={DOCUMENT_TITLES.STUDENT_ID_CARD}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <PrintDetailItem label="Student Name" value={student.fullName} />
          {student.admissionNumber ? (
            <PrintDetailItem
              label="Admission Number"
              value={student.admissionNumber}
            />
          ) : null}
          {student.currentEnrollment ? (
            <>
              <PrintDetailItem
                label="Class & Section"
                value={`${student.currentEnrollment.className} ${student.currentEnrollment.sectionName}`.trim()}
              />
              <PrintDetailItem
                label="Academic Year"
                value={student.currentEnrollment.academicYearName}
              />
            </>
          ) : (
            <PrintDetailItem
              label="Class & Section"
              value={`${student.className} ${student.sectionName}`.trim()}
            />
          )}
          <PrintDetailItem label="Campus" value={student.campusName} />
          {primaryGuardian ? (
            <>
              <PrintDetailItem
                label="Guardian Name"
                value={primaryGuardian.name}
              />
              <PrintDetailItem
                label="Guardian Mobile"
                value={primaryGuardian.mobile}
              />
            </>
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
