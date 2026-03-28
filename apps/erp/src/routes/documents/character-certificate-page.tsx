import { useParams } from "react-router";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useStudentSummaryQuery } from "@/features/students/api/use-students";

export function CharacterCertificatePage() {
  useDocumentTitle("Character Certificate");
  const { studentId } = useParams();
  const institutionId = useAuthStore(
    (store) => store.session?.activeOrganization?.id,
  );
  const summaryQuery = useStudentSummaryQuery(institutionId, studentId);
  const student = summaryQuery.data?.student;

  if (summaryQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading certificate data...
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

  return (
    <PrintDocumentShell
      backHref={`/students/${studentId}`}
      subtitle={`Certificate No. CC-${studentId?.slice(0, 8).toUpperCase()}`}
      title={DOCUMENT_TITLES.CHARACTER_CERTIFICATE}
    >
      <div className="space-y-8">
        <p className="text-sm leading-relaxed text-muted-foreground">
          This is to certify that{" "}
          <strong className="text-foreground">{student.fullName}</strong>
          {student.admissionNumber
            ? ` (Admission No. ${student.admissionNumber})`
            : ""}{" "}
          is/was a student of this institution.
        </p>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <PrintDetailItem label="Student Name" value={student.fullName} />
          {student.admissionNumber ? (
            <PrintDetailItem
              label="Admission Number"
              value={student.admissionNumber}
            />
          ) : null}
          <PrintDetailItem label="Campus" value={student.campusName} />
          <PrintDetailItem label="Class" value={student.className} />
          <PrintDetailItem label="Section" value={student.sectionName} />
        </div>

        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-muted-foreground">
            During the period of study, the student&apos;s character and conduct
            were found to be <strong className="text-foreground">Good</strong>.
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            The student has displayed satisfactory behaviour and discipline
            throughout. This certificate is issued on request for official
            purposes.
          </p>
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
