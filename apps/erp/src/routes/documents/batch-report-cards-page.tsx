import { useSearchParams } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useBatchReportCardsQuery } from "@/features/exams/api/use-exams";
import { formatAcademicYear } from "@/lib/format";
import { readCachedTenantBranding } from "@/lib/tenant-branding";

export function BatchReportCardsPage() {
  useDocumentTitle("Batch Report Cards");
  const [searchParams] = useSearchParams();
  const examTermId = searchParams.get("examTermId") ?? undefined;
  const classId = searchParams.get("classId") ?? undefined;
  const sectionId = searchParams.get("sectionId") ?? undefined;

  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const branding = readCachedTenantBranding();

  const batchQuery = useBatchReportCardsQuery(
    examTermId,
    classId,
    sectionId,
    Boolean(institutionId && examTermId && classId),
  );

  const reportCards = batchQuery.data ?? [];

  if (batchQuery.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">Loading report cards...</p>
      </div>
    );
  }

  if (reportCards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-muted-foreground">
          No report cards found for this selection.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4 print:hidden">
        <Button onClick={() => window.print()}>
          Print all {reportCards.length} report cards
        </Button>
        <span className="ml-3 text-sm text-muted-foreground">
          {reportCards.length} report card{reportCards.length !== 1 ? "s" : ""}
        </span>
      </div>

      {reportCards.map((card, index) => (
        <div
          key={card.studentId}
          className="mx-auto max-w-[210mm] bg-white px-8 py-6"
          style={{
            pageBreakAfter: index < reportCards.length - 1 ? "always" : "auto",
          }}
        >
          {/* Header */}
          <div className="mb-6 border-b pb-4 text-center">
            {branding?.logoUrl ? (
              <img
                src={branding.logoUrl}
                alt=""
                className="mx-auto mb-2 h-12"
              />
            ) : null}
            <h1 className="text-lg font-bold">
              {branding?.institutionName ?? "Report Card"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {card.examTermName} &middot;{" "}
              {formatAcademicYear(card.academicYearName)}
            </p>
          </div>

          {/* Student info */}
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Student: </span>
              <span className="font-medium">{card.studentFullName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Admission No: </span>
              <span className="font-medium">{card.admissionNumber}</span>
            </div>
            {card.classRank ? (
              <div>
                <span className="text-muted-foreground">Class Rank: </span>
                <span className="font-semibold">#{card.classRank}</span>
              </div>
            ) : null}
          </div>

          {/* Subject table */}
          <table className="mb-4 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="px-2 py-1.5 text-left font-medium">Subject</th>
                <th className="px-2 py-1.5 text-right font-medium">Max</th>
                <th className="px-2 py-1.5 text-right font-medium">Obtained</th>
                <th className="px-2 py-1.5 text-right font-medium">%</th>
                <th className="px-2 py-1.5 text-right font-medium">Grade</th>
                <th className="px-2 py-1.5 text-right font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {card.subjects.map((subject) => (
                <tr key={subject.subjectName} className="border-b">
                  <td className="px-2 py-1.5">{subject.subjectName}</td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {subject.maxMarks}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {subject.effectiveMarks ?? subject.obtainedMarks}
                  </td>
                  <td className="px-2 py-1.5 text-right tabular-nums">
                    {subject.percent}%
                  </td>
                  <td className="px-2 py-1.5 text-right">{subject.grade}</td>
                  <td className="px-2 py-1.5 text-right">{subject.result}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 font-semibold">
                <td className="px-2 py-1.5">Total</td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {card.summary.totalMaxMarks}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {card.summary.totalEffectiveMarks ??
                    card.summary.totalObtainedMarks}
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums">
                  {card.summary.overallPercent}%
                </td>
                <td className="px-2 py-1.5 text-right">
                  {card.summary.overallGrade}
                </td>
                <td className="px-2 py-1.5 text-right">
                  {card.summary.result}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Grading scheme */}
          <div className="mb-4 text-xs text-muted-foreground">
            <span className="font-medium">Grading: </span>
            {card.gradingScheme
              .map((b) => `${b.grade} (${b.minPercent}%+)`)
              .join(", ")}
          </div>
        </div>
      ))}
    </div>
  );
}
