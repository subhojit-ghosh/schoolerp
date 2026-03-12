import { useState } from "react";
import { Link } from "react-router-dom";
import { IconPlus, IconUserPlus } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@repo/ui/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateStudentMutation,
  useStudentsQuery,
} from "@/features/students/api/use-students";
import { StudentForm } from "@/features/students/ui/student-form";
import { ERP_ROUTES } from "@/constants/routes";
import type { StudentFormValues } from "@/features/students/model/student-form-schema";

const DEFAULT_GUARDIAN = {
  name: "",
  mobile: "",
  email: "",
  relationship: "guardian" as const,
  isPrimary: true,
};

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentsPage() {
  const [showForm, setShowForm] = useState(false);
  const authSession = useAuthStore((store) => store.session);
  const institutionId = authSession?.activeOrganization?.id;
  const campuses = authSession?.campuses ?? [];
  const studentsQuery = useStudentsQuery(institutionId);
  const createStudentMutation = useCreateStudentMutation(institutionId);
  const createStudentError = createStudentMutation.error as Error | null | undefined;

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId) return;

    await createStudentMutation.mutateAsync({
      params: { path: { institutionId } },
      body: values,
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

  const studentCount = studentsQuery.data?.length ?? 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Students</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {studentsQuery.isLoading
              ? "Loading…"
              : `${studentCount} student${studentCount !== 1 ? "s" : ""} enrolled`}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={() => setShowForm((v) => !v)}
          variant={showForm ? "outline" : "default"}
        >
          <IconPlus className="size-4" />
          {showForm ? "Cancel" : "Add student"}
        </Button>
      </div>

      {/* Create form — shown on demand */}
      {showForm ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New student</CardTitle>
            <CardDescription>
              Fill in the student details, assign a campus, and add one or more guardians.
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
              }}
              errorMessage={createStudentError?.message}
              isPending={createStudentMutation.isPending}
              onCancel={() => setShowForm(false)}
              onSubmit={onSubmit}
              submitLabel="Create student"
            />
          </CardContent>
        </Card>
      ) : null}

      {/* Student list */}
      <Card>
        <CardContent className="p-0">
          {studentsQuery.isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading students…
            </div>
          ) : studentsQuery.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <IconUserPlus className="size-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">No students yet</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add the first student record for this institution.
                </p>
              </div>
              <Button
                className="gap-2 mt-1"
                onClick={() => setShowForm(true)}
                size="sm"
                variant="outline"
              >
                <IconPlus className="size-3.5" />
                Add first student
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Admission no.</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Guardians</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentsQuery.data?.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                          {toInitials(student.fullName)}
                        </div>
                        <Link
                          className="text-sm font-medium hover:underline underline-offset-4"
                          to={ERP_ROUTES.STUDENT_DETAIL.replace(":studentId", student.id)}
                        >
                          {student.fullName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">
                      {student.admissionNumber}
                    </TableCell>
                    <TableCell className="text-sm">{student.campusName}</TableCell>
                    <TableCell>
                      <Badge
                        className="capitalize"
                        variant={student.status === "active" ? "default" : "secondary"}
                      >
                        {student.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.guardians.map((guardian) => (
                          <Badge key={guardian.membershipId} variant="outline">
                            {guardian.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
