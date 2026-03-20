import { useSearchParams } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_QUERY_PARAMS, DOCUMENT_TITLES } from "@/features/documents/model/document.constants";
import {
  PrintDetailItem,
  PrintDocumentShell,
} from "@/features/documents/ui/print-document-shell";
import { useExamReportCardQuery } from "@/features/exams/api/use-exams";

export function ExamReportCardPage() {
  const [searchParams] = useSearchParams();
  const examTermId = searchParams.get(DOCUMENT_QUERY_PARAMS.EXAM_TERM_ID) ?? undefined;
  const studentId = searchParams.get(DOCUMENT_QUERY_PARAMS.STUDENT_ID) ?? undefined;
  const institutionId = useAuthStore((store) => store.session?.activeOrganization?.id);

  const reportCardQuery = useExamReportCardQuery(
    institutionId,
    examTermId,
    studentId,
  );

  if (!examTermId || !studentId) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.EXAMS}
        subtitle="Select a term and student from the Exams page first."
        title={DOCUMENT_TITLES.EXAM_REPORT_CARD}
      >
        <p className="text-sm text-muted-foreground">
          Open a student report card from Exams to load the printable view.
        </p>
      </PrintDocumentShell>
    );
  }

  if (reportCardQuery.isLoading) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.EXAMS}
        subtitle="Loading report card..."
        title={DOCUMENT_TITLES.EXAM_REPORT_CARD}
      >
        <p className="text-sm text-muted-foreground">Loading report card...</p>
      </PrintDocumentShell>
    );
  }

  if (!reportCardQuery.data) {
    return (
      <PrintDocumentShell
        backHref={ERP_ROUTES.EXAMS}
        subtitle="The selected student does not have a printable report card for this term."
        title={DOCUMENT_TITLES.EXAM_REPORT_CARD}
      >
        <p className="text-sm text-muted-foreground">
          Save marks for the selected term, then open the report card again.
        </p>
      </PrintDocumentShell>
    );
  }

  const reportCard = reportCardQuery.data;

  return (
    <PrintDocumentShell
      backHref={ERP_ROUTES.EXAMS}
      subtitle={`${reportCard.examTermName} · ${reportCard.academicYearName}`}
      title={DOCUMENT_TITLES.EXAM_REPORT_CARD}
    >
      <div className="space-y-8">
        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PrintDetailItem label="Student" value={reportCard.studentFullName} />
          <PrintDetailItem
            label="Admission No."
            value={<span className="font-mono">{reportCard.admissionNumber}</span>}
          />
          <PrintDetailItem
            label="Percentage"
            value={`${reportCard.summary.overallPercent}%`}
          />
          <PrintDetailItem
            label="Overall Grade"
            value={
              <Badge className="w-fit">{reportCard.summary.overallGrade}</Badge>
            }
          />
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-[24px] border border-border/70 bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
                Subject performance
              </h2>
              <p className="text-sm text-muted-foreground">
                {reportCard.summary.totalObtainedMarks}/
                {reportCard.summary.totalMaxMarks}
              </p>
            </div>

            {reportCard.subjects.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-2xl border border-border/70">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Percent</TableHead>
                      <TableHead className="text-right">Grade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reportCard.subjects.map((subject) => (
                      <TableRow key={subject.subjectName}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{subject.subjectName}</p>
                            {subject.remarks ? (
                              <p className="text-xs text-muted-foreground">
                                {subject.remarks}
                              </p>
                            ) : null}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {subject.obtainedMarks}/{subject.maxMarks}
                        </TableCell>
                        <TableCell className="text-right">
                          {subject.percent}%
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{subject.grade}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-dashed border-border/80 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
                No subject marks are saved for this student in the selected
                exam term yet. The printable layout still shows the grading
                scale and summary so staff can confirm term setup during a demo.
              </div>
            )}
          </div>

          <div className="space-y-4 rounded-[24px] border border-border/70 bg-muted/10 px-5 py-5">
            <h2 className="font-[family:var(--font-heading)] text-xl font-semibold">
              Summary
            </h2>
            <div className="grid gap-3">
              <PrintDetailItem
                label="Exam Term"
                value={reportCard.examTermName}
              />
              <PrintDetailItem
                label="Academic Year"
                value={reportCard.academicYearName}
              />
              <PrintDetailItem
                label="Total Marks"
                value={`${reportCard.summary.totalObtainedMarks}/${reportCard.summary.totalMaxMarks}`}
              />
              <PrintDetailItem
                label="Overall Percent"
                value={`${reportCard.summary.overallPercent}%`}
              />
            </div>

            <div className="rounded-2xl border border-border/70 bg-white px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Grading scheme
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {reportCard.gradingScheme.map((band) => (
                  <Badge key={band.grade} variant="outline">
                    {band.grade}: {band.minPercent}%+ ({band.label})
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </PrintDocumentShell>
  );
}
