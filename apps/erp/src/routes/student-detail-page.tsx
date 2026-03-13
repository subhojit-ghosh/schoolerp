import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Separator } from "@repo/ui/components/ui/separator";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useStudentQuery,
  useUpdateStudentMutation,
} from "@/features/students/api/use-students";
import { StudentForm } from "@/features/students/ui/student-form";
import { ERP_ROUTES } from "@/constants/routes";
import type { StudentFormValues } from "@/features/students/model/student-form-schema";

function toInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function StudentDetailPage() {
  const navigate = useNavigate();
  const { studentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const institutionId = session?.activeOrganization?.id;
  const canManageStudents = isStaffContext(session);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const campuses = session?.campuses ?? [];
  const studentQuery = useStudentQuery(managedInstitutionId, studentId);
  const updateStudentMutation = useUpdateStudentMutation(managedInstitutionId);
  const updateError = updateStudentMutation.error as Error | null | undefined;

  const defaultValues = useMemo<StudentFormValues>(() => {
    const student = studentQuery.data;

    if (!student) {
      return {
        admissionNumber: "",
        firstName: "",
        lastName: "",
        className: "",
        sectionName: "",
        campusId: session?.activeCampus?.id ?? "",
        guardians: [],
      };
    }

    return {
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName ?? "",
      className: student.className,
      sectionName: student.sectionName,
      campusId: student.campusId,
      guardians: student.guardians.map((guardian) => ({
        name: guardian.name,
        mobile: guardian.mobile,
        email: guardian.email ?? "",
        relationship: guardian.relationship,
        isPrimary: guardian.isPrimary,
      })),
    };
  }, [session?.activeCampus?.id, studentQuery.data]);

  async function onSubmit(values: StudentFormValues) {
    if (!institutionId || !studentId) {
      return;
    }

    await updateStudentMutation.mutateAsync({
      params: {
        path: {
          institutionId,
          studentId,
        },
      },
      body: values,
    });

    toast.success("Student updated.");
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session to manage student records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!canManageStudents) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student</CardTitle>
          <CardDescription>
            Student editing is available in Staff view. You are currently in {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.DASHBOARD}>Back to dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (studentQuery.isLoading) {
    return (
      <Card>
        <CardContent className="py-16 text-center text-sm text-muted-foreground">
          Loading student details...
        </CardContent>
      </Card>
    );
  }

  if (!studentQuery.data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Student not found</CardTitle>
          <CardDescription>
            The requested record could not be loaded for this institution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={ERP_ROUTES.STUDENTS}>
              <IconChevronLeft data-icon="inline-start" />
              Back to students
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const student = studentQuery.data;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted text-lg font-semibold text-muted-foreground">
            {toInitials(student.fullName)}
          </div>
          <div className="space-y-1">
            <Button asChild className="-ml-3" size="sm" variant="ghost">
              <Link to={ERP_ROUTES.STUDENTS}>
                <IconChevronLeft data-icon="inline-start" />
                Back to students
              </Link>
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-foreground">{student.fullName}</h2>
              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                {student.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Admission {student.admissionNumber} • {student.className} {student.sectionName} • {student.campusName}
            </p>
          </div>
        </div>
        <Button onClick={() => void navigate(ERP_ROUTES.STUDENTS)} variant="outline">
          Done
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Edit student</CardTitle>
            <CardDescription>
              Update the student profile, campus assignment, and linked guardians.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StudentForm
              campuses={campuses}
              defaultValues={defaultValues}
              errorMessage={updateError?.message}
              isPending={updateStudentMutation.isPending}
              onSubmit={onSubmit}
              submitLabel="Save changes"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Linked guardians</CardTitle>
            <CardDescription>
              Current guardian contacts available to the student record.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {student.guardians.map((guardian, index) => (
              <div key={guardian.membershipId} className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{guardian.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {guardian.mobile}
                      {guardian.email ? ` • ${guardian.email}` : ""}
                    </p>
                  </div>
                  <Badge variant={guardian.isPrimary ? "default" : "outline"}>
                    {guardian.isPrimary ? "Primary" : guardian.relationship}
                  </Badge>
                </div>
                {index < student.guardians.length - 1 ? <Separator /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
