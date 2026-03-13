import { GUARDIAN_RELATIONSHIPS } from "@repo/contracts";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  IconArrowRight,
  IconBuildingEstate,
  IconPlus,
  IconSparkles,
  IconUserPlus,
  IconUsers,
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
import { cn } from "@repo/ui/lib/utils";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStudentMutation,
  useStudentsQuery,
} from "@/features/students/api/use-students";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { StudentForm } from "@/features/students/ui/student-form";
import { ERP_ROUTES } from "@/constants/routes";
import {
  EMPTY_CURRENT_ENROLLMENT,
  toStudentMutationBody,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";

const DEFAULT_GUARDIAN = {
  name: "",
  mobile: "",
  email: "",
  relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
  isPrimary: true,
};
const ERROR_BOUNDARY_PREVIEW_PARAM = "previewErrorBoundary";
const ERROR_BOUNDARY_PREVIEW_VALUE = "1";
const ERROR_BOUNDARY_PREVIEW_MESSAGE =
  "Intentional crash to preview the ERP error boundary.";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [searchParams] = useSearchParams();
  const authSession = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(authSession);
  const institutionId = authSession?.activeOrganization?.id;
  const canManageStudents = isStaffContext(authSession);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const campuses = authSession?.campuses ?? [];
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const studentsQuery = useStudentsQuery(managedInstitutionId);
  const createStudentMutation = useCreateStudentMutation(managedInstitutionId);
  const createStudentError = createStudentMutation.error as
    | Error
    | null
    | undefined;

  const students = studentsQuery.data ?? [];
  const studentCount = students.length;
  const primaryCampusName = authSession?.activeCampus?.name ?? "No campus";
  const guardianCount = useMemo(
    () =>
      new Set(
        students.flatMap((student) =>
          student.guardians.map((guardian) => guardian.membershipId),
        ),
      ).size,
    [students],
  );

  if (
    searchParams.get(ERROR_BOUNDARY_PREVIEW_PARAM) ===
    ERROR_BOUNDARY_PREVIEW_VALUE
  ) {
    throw new Error(ERROR_BOUNDARY_PREVIEW_MESSAGE);
  }

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId) {
      return;
    }

    await createStudentMutation.mutateAsync({
      params: { path: { institutionId } },
      body: toStudentMutationBody(values),
    });
    setShowForm(false);
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing student records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Student management is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_360px]">
        <Card className="relative overflow-hidden border-border/70 bg-card shadow-sm">
          <div
            className="absolute inset-0 opacity-100"
            style={{
              background:
                "radial-gradient(circle at top left, color-mix(in srgb, var(--primary) 10%, transparent), transparent 38%), radial-gradient(circle at right center, color-mix(in srgb, var(--accent) 9%, transparent), transparent 28%)",
            }}
          />
          <CardContent className="relative flex flex-col gap-6 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <Badge className="rounded-full px-3 py-1" variant="secondary">
                  <IconSparkles className="mr-1.5 size-3.5" />
                  Student registry
                </Badge>
                <div className="space-y-2">
                  <h2 className="text-3xl font-semibold tracking-tight text-foreground">
                    Students
                  </h2>
                  <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                    Keep the active roster tight. Add new learners, reconcile
                    guardians, and move quickly into detailed editing from a
                    cleaner registry view.
                  </p>
                </div>
              </div>
              <Button
                className="h-11 rounded-xl px-5 text-base shadow-sm"
                onClick={() => setShowForm((value) => !value)}
                variant={showForm ? "outline" : "default"}
              >
                <IconPlus className="size-4" />
                {showForm ? "Close form" : "Add student"}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Active roster
                </p>
                <div className="mt-3 flex items-end gap-2">
                  <span className="text-3xl font-semibold tracking-tight">
                    {studentsQuery.isLoading ? "—" : studentCount}
                  </span>
                  <span className="pb-1 text-sm text-muted-foreground">
                    enrolled students
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Active campus
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <IconBuildingEstate className="size-4 text-[var(--primary)]" />
                  <span className="text-lg font-semibold tracking-tight">
                    {primaryCampusName}
                  </span>
                </div>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/85 p-4 shadow-xs">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/75">
                  Linked guardians
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <IconUsers className="size-4 text-[var(--primary)]" />
                  <span className="text-lg font-semibold tracking-tight">
                    {studentsQuery.isLoading ? "—" : guardianCount}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Registry notes</CardTitle>
            <CardDescription>
              The first slice stays intentionally minimal, but the screen should
              still feel like a control surface, not a placeholder.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-dashed border-border/70 bg-muted/25 p-4">
              <p className="text-sm font-medium text-foreground">
                Primary workflow
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Add a student, click into the profile, then edit guardians and
                campus assignment from the detail screen.
              </p>
            </div>
            <div className="rounded-2xl border border-border/70 bg-background/80 p-4">
              <p className="text-sm font-medium text-foreground">
                Current density
              </p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                The roster is tuned for low-volume early testing, so small data
                sets still look deliberate instead of empty.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {showForm ? (
        <Card className="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Create student record</CardTitle>
            <CardDescription>
              Fill in the student details, assign a campus, and attach one or
              more guardians.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentForm
              campuses={campuses}
              defaultValues={{
                admissionNumber: "",
                firstName: "",
                lastName: "",
                campusId: authSession?.activeCampus?.id ?? "",
                guardians: [DEFAULT_GUARDIAN],
                currentEnrollment: EMPTY_CURRENT_ENROLLMENT,
              }}
              academicYears={academicYearsQuery.data ?? []}
              errorMessage={createStudentError?.message}
              isPending={createStudentMutation.isPending}
              onCancel={() => setShowForm(false)}
              onSubmit={onSubmit}
              submitLabel="Create student"
            />
          </CardContent>
        </Card>
      ) : null}

      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardHeader className="border-b border-border/70 bg-muted/20 pb-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Roster</CardTitle>
              <CardDescription>
                Click a record to open the edit surface. This list is intentionally tighter than the earlier table layout.
              </CardDescription>
            </div>
            <Badge className="rounded-full px-3 py-1.5" variant="outline">
              {studentsQuery.isLoading
                ? "Syncing roster"
                : `${studentCount} active ${studentCount === 1 ? "record" : "records"}`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {studentsQuery.isLoading ? (
            <div className="flex min-h-56 items-center justify-center rounded-2xl border border-dashed border-border/70 bg-muted/20 text-sm text-muted-foreground">
              Loading student registry…
            </div>
          ) : studentCount === 0 ? (
            <div className="flex min-h-72 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/20 px-6 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-background shadow-xs">
                <IconUserPlus className="size-6 text-[var(--primary)]" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-foreground">
                  No students yet
                </p>
                <p className="max-w-md text-sm leading-6 text-muted-foreground">
                  Start with the first admission record. Once a few students
                  exist, this screen becomes the fast-moving registry surface.
                </p>
              </div>
              <Button
                className="rounded-xl px-4"
                onClick={() => setShowForm(true)}
              >
                <IconPlus className="size-4" />
                Add first student
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {students.map((student, index) => (
                <Link
                  key={student.id}
                  className={cn(
                    "group relative overflow-hidden rounded-2xl border border-border/70 bg-card px-5 py-4 transition-all",
                    "hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md",
                  )}
                  to={ERP_ROUTES.STUDENT_DETAIL.replace(":studentId", student.id)}
                >
                  <div
                    className="absolute inset-y-0 left-0 w-1"
                    style={{
                      background:
                        index % 2 === 0
                          ? "var(--primary)"
                          : "color-mix(in srgb, var(--accent) 75%, var(--primary) 25%)",
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-4 pl-1">
                    <div className="flex min-w-[220px] flex-1 items-center gap-3">
                      <div className="flex size-11 items-center justify-center rounded-2xl bg-muted text-sm font-semibold text-muted-foreground">
                        {toInitials(student.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold tracking-tight text-foreground">
                          {student.fullName}
                        </p>
                        <p className="truncate text-sm text-muted-foreground">
                          Admission {student.admissionNumber}
                          {student.currentEnrollment
                            ? ` • ${student.currentEnrollment.className}-${student.currentEnrollment.sectionName}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className="rounded-full px-3 py-1" variant="secondary">
                        {student.campusName}
                      </Badge>
                      <Badge
                        className="rounded-full px-3 py-1 capitalize"
                        variant={student.status === "active" ? "default" : "secondary"}
                      >
                        {student.status}
                      </Badge>
                    </div>

                    <div className="flex min-w-[220px] flex-1 flex-wrap gap-2">
                      {student.guardians.map((guardian) => (
                        <Badge
                          key={guardian.membershipId}
                          className="rounded-full px-3 py-1"
                          variant="outline"
                        >
                          {guardian.name}
                        </Badge>
                      ))}
                      {student.currentEnrollment ? (
                        <Badge className="rounded-full px-3 py-1" variant="outline">
                          {student.currentEnrollment.academicYearName}
                        </Badge>
                      ) : null}
                    </div>

                    <div className="ml-auto flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                      Edit record
                      <IconArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
