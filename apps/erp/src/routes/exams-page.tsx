import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { IconCertificate, IconClipboardList, IconPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  useCreateExamTermMutation,
  useExamMarksQuery,
  useExamTermsQuery,
  useReplaceExamMarksMutation,
} from "@/features/exams/api/use-exams";
import {
  type ExamMarksFormValues,
  type ExamTermFormValues,
} from "@/features/exams/model/exam-form-schema";
import { ExamMarksForm } from "@/features/exams/ui/exam-marks-form";
import { ExamTermForm } from "@/features/exams/ui/exam-term-form";
import { useStudentsQuery } from "@/features/students/api/use-students";

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
  const studentsQuery = useStudentsQuery(managedInstitutionId);
  const examTermsQuery = useExamTermsQuery(managedInstitutionId);
  const createExamTermMutation = useCreateExamTermMutation(managedInstitutionId);
  const replaceMarksMutation = useReplaceExamMarksMutation(managedInstitutionId);
  const [selectedExamTermId, setSelectedExamTermId] = useState<string>();

  const examTerms = examTermsQuery.data ?? [];
  const examMarksQuery = useExamMarksQuery(managedInstitutionId, selectedExamTermId);

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

  const termDefaultValues: ExamTermFormValues = useMemo(
    () => ({
      academicYearId:
        academicYearsQuery.data?.find((academicYear) => academicYear.isCurrent)?.id ??
        academicYearsQuery.data?.[0]?.id ??
        "",
      name: "",
      startDate: "",
      endDate: "",
    }),
    [academicYearsQuery.data],
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
      params: {
        path: {
          institutionId,
        },
      },
      body: values,
    });

    setSelectedExamTermId(createdTerm.id);
    toast.success("Exam term created.");
  }

  async function handleSaveMarks(values: ExamMarksFormValues) {
    if (!institutionId || !selectedExamTermId) {
      return;
    }

    await replaceMarksMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          examTermId: selectedExamTermId,
        },
      },
      body: values,
    });

    toast.success("Marks updated.");
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Exams</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage exam terms and marks.
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
            Exams administration is available in Staff view. You are currently in {activeContext?.label ?? "another"} view.
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
              Create exam term
            </CardTitle>
            <CardDescription>
              Keep exam planning shallow for now: one term linked to one academic year.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ExamTermForm
              academicYears={(academicYearsQuery.data ?? []).map((academicYear) => ({
                id: academicYear.id,
                name: academicYear.name,
              }))}
              defaultValues={termDefaultValues}
              errorMessage={(createExamTermMutation.error as Error | null | undefined)?.message}
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
                        <p className="font-medium text-foreground">{term.name}</p>
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
              Batch-save subject scores for the selected term. Business rules stay in the API.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedExamTermId ? (
              <div className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
                Select an exam term to enter marks.
              </div>
            ) : studentsQuery.data?.length ? (
              <ExamMarksForm
                defaultValues={marksDefaultValues}
                errorMessage={(replaceMarksMutation.error as Error | null | undefined)?.message}
                isPending={replaceMarksMutation.isPending}
                onSubmit={handleSaveMarks}
                students={(studentsQuery.data ?? []).map((student) => ({
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
              The saved list reflects the latest batch persisted for the selected term.
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
      </div>
    </div>
  );
}
