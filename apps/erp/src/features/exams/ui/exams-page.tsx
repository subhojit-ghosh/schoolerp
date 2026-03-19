import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  IconCertificate,
  IconClipboardList,
  IconPlus,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  useCreateExamTermMutation,
  useExamMarksQuery,
  useExamReportCardQuery,
  useExamTermsQuery,
  useReplaceExamMarksMutation,
} from "@/features/exams/api/use-exams";
import {
  type ExamMarksFormValues,
  type ExamTermFormValues,
} from "@/features/exams/model/exam-form-schema";
import { ExamMarksForm } from "@/features/exams/ui/exam-marks-form";
import { ExamTermForm } from "@/features/exams/ui/exam-term-form";
import { useStudentOptionsQuery } from "@/features/students/api/use-students";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const EMPTY_MARKS_ENTRY: ExamMarksFormValues["entries"][number] = {
  studentId: "",
  subjectName: "",
  maxMarks: 100,
  obtainedMarks: 0,
  remarks: "",
};

export function ExamsPage() {
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageExams = isStaffContext(session);
  const managedInstitutionId = canManageExams ? institutionId : undefined;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const studentOptionsQuery = useStudentOptionsQuery(managedInstitutionId);
  const examTermsQuery = useExamTermsQuery(managedInstitutionId);
  const createExamTermMutation =
    useCreateExamTermMutation(managedInstitutionId);
  const replaceMarksMutation =
    useReplaceExamMarksMutation(managedInstitutionId);
  const [selectedExamTermId, setSelectedExamTermId] = useState<string>();
  const [selectedReportStudentId, setSelectedReportStudentId] =
    useState<string>();
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
      remarks: mark.remarks ?? "",
    }));

    return {
      entries: entries.length > 0 ? entries : [EMPTY_MARKS_ENTRY],
    };
  }, [examMarksQuery.data]);

  async function handleCreateTerm(values: ExamTermFormValues) {
    if (!institutionId) {
      return;
    }

    const createdTerm = await createExamTermMutation.mutateAsync({
      body: values,
    });

    setSelectedExamTermId(createdTerm.id);
    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.EXAM_TERM));
  }

  async function handleSaveMarks(values: ExamMarksFormValues) {
    if (!institutionId || !selectedExamTermId) {
      return;
    }

    await replaceMarksMutation.mutateAsync({
      params: {
        path: {
          examTermId: selectedExamTermId,
        },
      },
      body: values,
    });

    toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.MARKS));
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

  if (!canManageExams) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            Exams administration is available in Staff view. You are currently
            in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconPlus className="size-4 text-[var(--primary)]" />
              New exam term
            </CardTitle>
            <CardDescription>
              Keep exam planning shallow for now: one term linked to one
              academic year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExamTermForm
              academicYears={academicYears.map((academicYear) => ({
                id: academicYear.id,
                name: academicYear.name,
              }))}
              defaultValues={termDefaultValues}
              errorMessage={
                (createExamTermMutation.error as Error | null | undefined)
                  ?.message
              }
              isPending={createExamTermMutation.isPending}
              onSubmit={handleCreateTerm}
            />
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconClipboardList className="size-4 text-[var(--primary)]" />
              Exam terms
            </CardTitle>
            <CardDescription>
              Pick a term to review or replace its marks sheet.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {examTermsQuery.isLoading ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Loading exam terms...
              </div>
            ) : examTerms.length > 0 ? (
              examTerms.map((term) => {
                const isSelected = term.id === selectedExamTermId;

                return (
                  <button
                    key={term.id}
                    className="rounded-xl border px-4 py-4 text-left transition-colors hover:border-primary/35"
                    data-selected={isSelected || undefined}
                    onClick={() => setSelectedExamTermId(term.id)}
                    type="button"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          {term.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {term.academicYearName}
                        </p>
                      </div>
                      {isSelected ? <Badge>Selected</Badge> : null}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {term.startDate} to {term.endDate}
                    </p>
                  </button>
                );
              })
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Create the first exam term after adding an academic year.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <IconCertificate className="size-4 text-[var(--primary)]" />
              Marks entry
            </CardTitle>
            <CardDescription>
              Batch-save subject scores for the selected term. Business rules
              stay in the API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedExamTermId ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Select an exam term to enter marks.
              </div>
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
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Add students before entering marks.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Saved marks</CardTitle>
            <CardDescription>
              The saved list reflects the latest batch persisted for the
              selected term.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {!selectedExamTermId ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Select an exam term to review saved marks.
              </div>
            ) : examMarksQuery.isLoading ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Loading marks...
              </div>
            ) : (examMarksQuery.data?.length ?? 0) > 0 ? (
              examMarksQuery.data?.map((mark) => (
                <div
                  key={mark.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
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
                  <Badge variant="outline">
                    {mark.obtainedMarks}/{mark.maxMarks}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                No marks saved for this term yet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Report card</CardTitle>
            <CardDescription>
              Subject-wise marks, grade bands, and overall grade for one student
              in the selected term.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {!selectedExamTermId ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Select an exam term to view report cards.
              </div>
            ) : (studentOptionsQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Add students before generating report cards.
              </div>
            ) : (
              <>
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
                  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                    Loading report card...
                  </div>
                ) : examReportCardQuery.isError ? (
                  <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-destructive">
                    {(examReportCardQuery.error as Error | null | undefined)
                      ?.message ?? "Could not load report card."}
                  </div>
                ) : examReportCardQuery.data ? (
                  <div className="space-y-4 rounded-xl border bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">
                          {examReportCardQuery.data.studentFullName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {examReportCardQuery.data.examTermName} ·{" "}
                          {examReportCardQuery.data.academicYearName} ·{" "}
                          {examReportCardQuery.data.admissionNumber}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>
                          {examReportCardQuery.data.summary.overallGrade}
                        </Badge>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => window.print()}
                        >
                          Print
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="rounded-lg border bg-muted/20 px-3 py-2">
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">
                          Total marks
                        </p>
                        <p className="text-base font-semibold tabular-nums">
                          {examReportCardQuery.data.summary.totalObtainedMarks}/
                          {examReportCardQuery.data.summary.totalMaxMarks}
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
                          Overall grade
                        </p>
                        <p className="text-base font-semibold">
                          {examReportCardQuery.data.summary.overallGrade}
                        </p>
                      </div>
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
                            {examReportCardQuery.data.subjects.map(
                              (subject) => (
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
                                    <Badge variant="outline">
                                      {subject.grade}
                                    </Badge>
                                  </td>
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
                        No marks saved for this student in the selected term.
                      </div>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
