import { useEffect, useMemo, useState } from "react";
import { PERMISSIONS } from "@repo/contracts";
import { Link } from "react-router";
import { toast } from "sonner";
import { IconAlertTriangle, IconPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { EntityPagePrimaryAction } from "@/components/entities/entity-actions";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { ERP_ROUTES } from "@/constants/routes";
import { DOCUMENT_QUERY_PARAMS } from "@/features/documents/model/document.constants";
import {
  useClassAnalysisQuery,
  useCreateExamTermMutation,
  useExamMarksQuery,
  useExamReportCardQuery,
  useExamTermsQuery,
  useGradingScalesQuery,
  useRanksQuery,
  useReplaceExamMarksMutation,
} from "@/features/exams/api/use-exams";
import {
  type ExamMarksFormValues,
  type ExamTermFormValues,
} from "@/features/exams/model/exam-form-schema";
import { ExamMarksForm } from "@/features/exams/ui/exam-marks-form";
import { ExamTermForm } from "@/features/exams/ui/exam-term-form";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import { extractApiError } from "@/lib/api-error";
import { formatAcademicYear } from "@/lib/format";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const EMPTY_MARKS_ENTRY: ExamMarksFormValues["entries"][number] = {
  studentId: "",
  subjectName: "",
  maxMarks: 100,
  obtainedMarks: 0,
  graceMarks: 0,
  remarks: "",
};

const EXAM_TYPE_LABELS: Record<string, string> = {
  unit_test: "Unit Test",
  midterm: "Mid-Term",
  final: "Final",
  practical: "Practical",
};

function buildExamReportCardHref(
  examTermId: string | undefined,
  studentId: string | undefined,
): string {
  const params = new URLSearchParams();

  if (examTermId) {
    params.set(DOCUMENT_QUERY_PARAMS.EXAM_TERM_ID, examTermId);
  }

  if (studentId) {
    params.set(DOCUMENT_QUERY_PARAMS.STUDENT_ID, studentId);
  }

  const query = params.toString();

  return query
    ? `${ERP_ROUTES.EXAM_REPORT_CARD}?${query}`
    : ERP_ROUTES.EXAM_REPORT_CARD;
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export function ExamsPage() {
  useDocumentTitle("Exams");
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const managedInstitutionId =
    isStaffContext(session) && hasPermission(session, PERMISSIONS.EXAMS_READ)
      ? institutionId
      : undefined;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const studentOptionsQuery = useStudentOptionsQuery(managedInstitutionId);
  const examTermsQuery = useExamTermsQuery(managedInstitutionId);
  const createExamTermMutation =
    useCreateExamTermMutation(managedInstitutionId);
  const replaceMarksMutation =
    useReplaceExamMarksMutation(managedInstitutionId);
  const gradingScalesQuery = useGradingScalesQuery(
    Boolean(managedInstitutionId),
  );
  const [selectedExamTermId, setSelectedExamTermId] = useState<string>();
  const [selectedClassId, setSelectedClassId] = useState<string>();
  const [selectedReportStudentId, setSelectedReportStudentId] =
    useState<string>();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const academicYears = useMemo(
    () => academicYearsQuery.data?.rows ?? [],
    [academicYearsQuery.data?.rows],
  );

  const examTerms = useMemo(
    () => examTermsQuery.data ?? [],
    [examTermsQuery.data],
  );
  const examMarksQuery = useExamMarksQuery(
    managedInstitutionId,
    selectedExamTermId,
  );
  const examReportCardQuery = useExamReportCardQuery(
    managedInstitutionId,
    selectedExamTermId,
    selectedReportStudentId,
  );
  const classAnalysisQuery = useClassAnalysisQuery(
    selectedExamTermId,
    selectedClassId,
  );
  const ranksQuery = useRanksQuery(selectedExamTermId, selectedClassId);

  useEffect(() => {
    if (examTerms.length === 0) {
      setSelectedExamTermId(undefined);
      return;
    }

    setSelectedExamTermId((currentTermId) =>
      currentTermId && examTerms.some((term) => term.id === currentTermId)
        ? currentTermId
        : examTerms[0]?.id,
    );
  }, [examTerms]);

  useEffect(() => {
    const students = studentOptionsQuery.data ?? [];
    if (students.length === 0) {
      setSelectedReportStudentId(undefined);
      return;
    }

    setSelectedReportStudentId((currentStudentId) =>
      currentStudentId &&
      students.some((student) => student.id === currentStudentId)
        ? currentStudentId
        : students[0]?.id,
    );
  }, [studentOptionsQuery.data]);

  const termDefaultValues: ExamTermFormValues = useMemo(
    () => ({
      academicYearId:
        academicYears.find((academicYear) => academicYear.isCurrent)?.id ??
        academicYears[0]?.id ??
        "",
      name: "",
      examType: "final" as const,
      weightageInBp: 10000,
      gradingScaleId: "",
      defaultPassingPercent: 33,
      startDate: "",
      endDate: "",
    }),
    [academicYears],
  );

  const marksDefaultValues: ExamMarksFormValues = useMemo(() => {
    const entries = (examMarksQuery.data ?? []).map((mark) => ({
      studentId: mark.studentId,
      subjectName: mark.subjectName,
      maxMarks: mark.maxMarks,
      obtainedMarks: mark.obtainedMarks,
      graceMarks: mark.graceMarks ?? 0,
      remarks: mark.remarks ?? "",
    }));

    return {
      entries: entries.length > 0 ? entries : [EMPTY_MARKS_ENTRY],
    };
  }, [examMarksQuery.data]);

  const marksCompletionSummary = useMemo(() => {
    const students = studentOptionsQuery.data ?? [];
    const marks = examMarksQuery.data ?? [];
    const totalStudents = students.length;

    if (totalStudents === 0 || !selectedExamTermId) {
      return null;
    }

    const studentsWithMarks = new Set(marks.map((mark) => mark.studentId));
    const studentsWithMarksCount = studentsWithMarks.size;
    const studentsWithoutMarks = students.filter(
      (student) => !studentsWithMarks.has(student.id),
    );

    return {
      totalStudents,
      studentsWithMarksCount,
      isComplete: studentsWithMarksCount >= totalStudents,
      studentsWithoutMarks: studentsWithoutMarks.map((student) => ({
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
      })),
    };
  }, [studentOptionsQuery.data, examMarksQuery.data, selectedExamTermId]);

  async function handleCreateTerm(values: ExamTermFormValues) {
    if (!institutionId) {
      return;
    }

    try {
      const createdTerm = await createExamTermMutation.mutateAsync({
        body: values,
      });

      setSelectedExamTermId(createdTerm.id);
      setIsCreateDialogOpen(false);
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.EXAM_TERM));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not create exam term. Please try again."),
      );
    }
  }

  async function handleSaveMarks(values: ExamMarksFormValues) {
    if (!institutionId || !selectedExamTermId) {
      return;
    }

    try {
      await replaceMarksMutation.mutateAsync({
        params: {
          path: {
            examTermId: selectedExamTermId,
          },
        },
        body: values,
      });

      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.MARKS));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save marks. Please try again."),
      );
    }
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage exam terms and
            marks.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!managedInstitutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            You don't have access to this section.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityPageHeader
        description="Manage exam terms, enter marks, and view report cards."
        title="Exams"
        actions={
          <EntityPagePrimaryAction onClick={() => setIsCreateDialogOpen(true)}>
            <IconPlus className="size-4" />
            New exam term
          </EntityPagePrimaryAction>
        }
      />

      {/* Exam terms */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Exam Terms</h2>
          <p className="text-sm text-muted-foreground">
            Select a term to review or replace its marks sheet.
          </p>
        </div>
        <div className="p-4">
          {examTermsQuery.isLoading ? (
            <EmptyState>Loading exam terms...</EmptyState>
          ) : examTerms.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {examTerms.map((term) => {
                const isSelected = term.id === selectedExamTermId;

                return (
                  <button
                    key={term.id}
                    className="rounded-lg border px-4 py-3 text-left transition-colors hover:border-primary/40 data-[selected]:border-primary data-[selected]:bg-primary/5"
                    data-selected={isSelected || undefined}
                    onClick={() => setSelectedExamTermId(term.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-foreground">{term.name}</p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="outline">
                          {EXAM_TYPE_LABELS[term.examType] ?? term.examType}
                        </Badge>
                        {isSelected ? <Badge>Selected</Badge> : null}
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatAcademicYear(term.academicYearName)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {term.startDate} to {term.endDate}
                    </p>
                    {isSelected && marksCompletionSummary ? (
                      <div className="mt-2">
                        {marksCompletionSummary.isComplete ? (
                          <Badge
                            className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            variant="secondary"
                          >
                            Marks complete
                          </Badge>
                        ) : (
                          <Badge
                            className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                            variant="secondary"
                          >
                            {marksCompletionSummary.studentsWithMarksCount}/
                            {marksCompletionSummary.totalStudents} students
                          </Badge>
                        )}
                      </div>
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <EmptyState>
              Create the first exam term after adding an academic year.
            </EmptyState>
          )}
        </div>
      </section>

      {/* Marks entry */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Marks Entry</h2>
          <p className="text-sm text-muted-foreground">
            Batch-save subject scores for the selected term.
          </p>
        </div>
        <div className="p-6">
          {!selectedExamTermId ? (
            <EmptyState>Select an exam term to enter marks.</EmptyState>
          ) : studentOptionsQuery.data?.length ? (
            <ExamMarksForm
              defaultValues={marksDefaultValues}
              errorMessage={
                (replaceMarksMutation.error as Error | null | undefined)
                  ?.message
              }
              isPending={replaceMarksMutation.isPending}
              onSubmit={handleSaveMarks}
              students={(studentOptionsQuery.data ?? []).map((student) => ({
                id: student.id,
                fullName: student.fullName,
                admissionNumber: student.admissionNumber,
              }))}
            />
          ) : (
            <EmptyState>Add students before entering marks.</EmptyState>
          )}
        </div>
      </section>

      {/* Saved marks */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Saved Marks</h2>
          <p className="text-sm text-muted-foreground">
            The saved list reflects the latest batch persisted for the selected
            term.
          </p>
        </div>
        <div className="p-4">
          {!selectedExamTermId ? (
            <EmptyState>Select an exam term to review saved marks.</EmptyState>
          ) : examMarksQuery.isLoading ? (
            <EmptyState>Loading marks...</EmptyState>
          ) : (examMarksQuery.data?.length ?? 0) > 0 ? (
            <div className="flex flex-col gap-3">
              {examMarksQuery.data?.map((mark) => (
                <div
                  key={mark.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">
                      {mark.studentFullName} · {mark.subjectName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {mark.admissionNumber}
                      {mark.remarks ? ` · ${mark.remarks}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mark.graceMarks > 0 ? (
                      <Badge variant="secondary" className="text-xs">
                        +{mark.graceMarks} grace
                      </Badge>
                    ) : null}
                    <Badge variant="outline">
                      {mark.obtainedMarks}/{mark.maxMarks}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>No marks saved for this term yet.</EmptyState>
          )}
        </div>
      </section>

      {/* Report card */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Report Card</h2>
          <p className="text-sm text-muted-foreground">
            Subject-wise marks, grade bands, and overall grade for one student
            in the selected term.
          </p>
        </div>
        <div className="p-6">
          {!selectedExamTermId ? (
            <EmptyState>Select an exam term to view report cards.</EmptyState>
          ) : (studentOptionsQuery.data?.length ?? 0) === 0 ? (
            <EmptyState>
              Add students before generating report cards.
            </EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              {marksCompletionSummary &&
              !marksCompletionSummary.isComplete &&
              !examMarksQuery.isLoading ? (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
                  <IconAlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="text-amber-800 dark:text-amber-200">
                    <p className="font-medium">
                      {marksCompletionSummary.studentsWithoutMarks.length}{" "}
                      {marksCompletionSummary.studentsWithoutMarks.length === 1
                        ? "student has"
                        : "students have"}{" "}
                      no marks entered for this term.
                    </p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-amber-700 dark:text-amber-300">
                      {marksCompletionSummary.studentsWithoutMarks
                        .slice(0, 5)
                        .map((student) => (
                          <li key={student.admissionNumber}>
                            {student.fullName} ({student.admissionNumber})
                          </li>
                        ))}
                      {marksCompletionSummary.studentsWithoutMarks.length >
                      5 ? (
                        <li>
                          and{" "}
                          {marksCompletionSummary.studentsWithoutMarks.length -
                            5}{" "}
                          more...
                        </li>
                      ) : null}
                    </ul>
                  </div>
                </div>
              ) : null}

              <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-end">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Student
                  </p>
                  <Select
                    onValueChange={setSelectedReportStudentId}
                    value={selectedReportStudentId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select student" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(studentOptionsQuery.data ?? []).map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.fullName} ({student.admissionNumber})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {examReportCardQuery.isLoading ? (
                <EmptyState>Loading report card...</EmptyState>
              ) : examReportCardQuery.isError ? (
                <div className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-destructive">
                  {(examReportCardQuery.error as Error | null | undefined)
                    ?.message ?? "Could not load report card."}
                </div>
              ) : examReportCardQuery.data ? (
                <div className="space-y-4 rounded-lg border p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {examReportCardQuery.data.studentFullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {examReportCardQuery.data.examTermName} ·{" "}
                        {formatAcademicYear(
                          examReportCardQuery.data.academicYearName,
                        )}{" "}
                        · {examReportCardQuery.data.admissionNumber}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>
                        {examReportCardQuery.data.summary.overallGrade}
                      </Badge>
                      <Button asChild size="sm" variant="outline">
                        <Link
                          target="_blank"
                          to={buildExamReportCardHref(
                            selectedExamTermId,
                            selectedReportStudentId,
                          )}
                        >
                          Printable view
                        </Link>
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Total marks
                      </p>
                      <p className="text-base font-semibold tabular-nums">
                        {examReportCardQuery.data.summary.totalEffectiveMarks ??
                          examReportCardQuery.data.summary.totalObtainedMarks}
                        /{examReportCardQuery.data.summary.totalMaxMarks}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Percentage
                      </p>
                      <p className="text-base font-semibold tabular-nums">
                        {examReportCardQuery.data.summary.overallPercent}%
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Grade / Result
                      </p>
                      <p className="text-base font-semibold">
                        {examReportCardQuery.data.summary.overallGrade}
                        {examReportCardQuery.data.summary.result ? (
                          <span
                            className={
                              examReportCardQuery.data.summary.result === "Pass"
                                ? "ml-2 text-emerald-600"
                                : "ml-2 text-destructive"
                            }
                          >
                            {examReportCardQuery.data.summary.result}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    {examReportCardQuery.data.classRank ? (
                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Class rank
                        </p>
                        <p className="text-base font-semibold">
                          #{examReportCardQuery.data.classRank}
                          {examReportCardQuery.data.sectionRank
                            ? ` (Section #${examReportCardQuery.data.sectionRank})`
                            : ""}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  {examReportCardQuery.data.subjects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Subject
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Score
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              %
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Grade
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {examReportCardQuery.data.subjects.map((subject) => (
                            <tr key={subject.subjectName}>
                              <td className="px-3 py-2">
                                <p className="font-medium text-foreground">
                                  {subject.subjectName}
                                </p>
                                {subject.remarks ? (
                                  <p className="text-xs text-muted-foreground">
                                    {subject.remarks}
                                  </p>
                                ) : null}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {subject.obtainedMarks}/{subject.maxMarks}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {subject.percent}%
                              </td>
                              <td className="px-3 py-2 text-right">
                                <Badge variant="outline">{subject.grade}</Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState>
                      No marks saved for this student in the selected term.
                    </EmptyState>
                  )}

                  <div className="rounded-lg border bg-muted/20 px-3 py-3">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Grading scheme
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {examReportCardQuery.data.gradingScheme.map((band) => (
                        <Badge key={band.grade} variant="outline">
                          {band.grade}: {band.minPercent}%+ ({band.label})
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Class analysis + ranks */}
      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">Class Analysis & Ranks</h2>
          <p className="text-sm text-muted-foreground">
            Subject-wise stats and ranked student list for the selected term.
          </p>
        </div>
        <div className="p-6">
          {!selectedExamTermId ? (
            <EmptyState>Select an exam term to view analysis.</EmptyState>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="grid gap-3 md:grid-cols-[280px_minmax(0,1fr)] md:items-end">
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Class
                  </p>
                  <Select
                    onValueChange={setSelectedClassId}
                    value={selectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class for analysis" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {(studentOptionsQuery.data ?? [])
                          .reduce<{ id: string; name: string }[]>(
                            (acc, s) => {
                              if (
                                "classId" in s &&
                                !acc.some((c) => c.id === (s as Record<string, string>).classId)
                              ) {
                                acc.push({
                                  id: (s as Record<string, string>).classId,
                                  name: (s as Record<string, string>).className ?? "Class",
                                });
                              }
                              return acc;
                            },
                            [],
                          )
                          .map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {classAnalysisQuery.data ? (
                <div className="space-y-4">
                  <div className="grid gap-3 sm:grid-cols-4">
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Students
                      </p>
                      <p className="text-base font-semibold tabular-nums">
                        {classAnalysisQuery.data.studentCount}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 px-3 py-2">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Class average
                      </p>
                      <p className="text-base font-semibold tabular-nums">
                        {classAnalysisQuery.data.classAverage}%
                      </p>
                    </div>
                    <div className="rounded-lg border bg-emerald-50 px-3 py-2 dark:bg-emerald-950">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Pass
                      </p>
                      <p className="text-base font-semibold text-emerald-700 tabular-nums dark:text-emerald-300">
                        {classAnalysisQuery.data.passCount}
                      </p>
                    </div>
                    <div className="rounded-lg border bg-red-50 px-3 py-2 dark:bg-red-950">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Fail
                      </p>
                      <p className="text-base font-semibold text-destructive tabular-nums">
                        {classAnalysisQuery.data.failCount}
                      </p>
                    </div>
                  </div>

                  {classAnalysisQuery.data.classTopperName ? (
                    <p className="text-sm text-muted-foreground">
                      Class topper:{" "}
                      <span className="font-medium text-foreground">
                        {classAnalysisQuery.data.classTopperName}
                      </span>{" "}
                      ({classAnalysisQuery.data.classTopperPercent}%)
                    </p>
                  ) : null}

                  {classAnalysisQuery.data.subjects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b bg-muted/30">
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Subject
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Avg
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Highest
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Lowest
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Pass
                            </th>
                            <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                              Fail
                            </th>
                            <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                              Topper
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {classAnalysisQuery.data.subjects.map((subject) => (
                            <tr key={subject.subjectName}>
                              <td className="px-3 py-2 font-medium">
                                {subject.subjectName}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {subject.average}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {subject.highest}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums">
                                {subject.lowest}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-emerald-600">
                                {subject.passCount}
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-destructive">
                                {subject.failCount}
                              </td>
                              <td className="px-3 py-2 text-muted-foreground">
                                {subject.topperName}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : selectedClassId ? (
                <EmptyState>Loading analysis...</EmptyState>
              ) : null}

              {ranksQuery.data?.students &&
              ranksQuery.data.students.length > 0 ? (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    Ranked Student List
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/30">
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Rank
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-muted-foreground">
                            Student
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Marks
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            %
                          </th>
                          <th className="px-3 py-2 text-right font-medium text-muted-foreground">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {ranksQuery.data.students.map((student) => (
                          <tr key={student.studentId}>
                            <td className="px-3 py-2 font-semibold tabular-nums">
                              #{student.rank}
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium">
                                {student.studentFullName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {student.admissionNumber}
                              </p>
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {student.totalEffectiveMarks}/
                              {student.totalMaxMarks}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {student.percentage}%
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Badge variant="outline">{student.grade}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </section>

      {/* Create exam term dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New exam term</DialogTitle>
            <DialogDescription>
              Create an exam term linked to an academic year.
            </DialogDescription>
          </DialogHeader>
          <ExamTermForm
            academicYears={academicYears.map((academicYear) => ({
              id: academicYear.id,
              name: academicYear.name,
            }))}
            gradingScales={(gradingScalesQuery.data ?? []).map((scale) => ({
              id: scale.id,
              name: scale.name,
              isDefault: scale.isDefault,
            }))}
            defaultValues={termDefaultValues}
            errorMessage={
              (createExamTermMutation.error as Error | null | undefined)
                ?.message
            }
            isPending={createExamTermMutation.isPending}
            onSubmit={handleCreateTerm}
          />
        </DialogContent>
      </Dialog>
    </EntityPageShell>
  );
}
