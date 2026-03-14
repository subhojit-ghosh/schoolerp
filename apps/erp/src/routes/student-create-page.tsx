import { GUARDIAN_RELATIONSHIPS } from "@repo/contracts";
import { Link, useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
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
import { ERP_ROUTES } from "@/constants/routes";
import {
  useCreateStudentMutation,
} from "@/features/students/api/use-students";
import {
  EMPTY_CURRENT_ENROLLMENT,
  toStudentMutationBody,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";
import { StudentForm } from "@/features/students/ui/student-form";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_GUARDIAN = {
  name: "",
  mobile: "",
  email: "",
  relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
  isPrimary: true,
};

export function StudentCreatePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const authSession = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(authSession);
  const institutionId = authSession?.activeOrganization?.id;
  const canManageStudents = isStaffContext(authSession);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const campuses = authSession?.campuses ?? [];
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const createStudentMutation = useCreateStudentMutation(managedInstitutionId);
  const createStudentError = createStudentMutation.error as
    | Error
    | null
    | undefined;

  async function handleSubmit(values: StudentFormValues) {
    if (!institutionId) {
      return;
    }

    await createStudentMutation.mutateAsync({
      body: toStudentMutationBody(values),
    });
    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.STUDENT));
    void navigate(appendSearch(ERP_ROUTES.STUDENTS, location.search));
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
            Student creation is available in Staff view. You are currently in{" "}
            {activeContext?.label ?? "another"} view.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <Button asChild className="-ml-3" size="sm" variant="ghost">
          <Link to={appendSearch(ERP_ROUTES.STUDENTS, location.search)}>
            <IconChevronLeft data-icon="inline-start" />
            Back to students
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create student</h1>
        <p className="text-sm text-muted-foreground">
          Fill in the student details, assign a campus, and attach one or more guardians.
        </p>
      </div>

      <Card className="max-w-5xl">
        <CardContent className="pt-6">
          <StudentForm
            academicYears={academicYearsQuery.data?.rows ?? []}
            campuses={campuses}
            defaultValues={{
              admissionNumber: "",
              firstName: "",
              lastName: "",
              classId: "",
              sectionId: "",
              campusId: authSession?.activeCampus?.id ?? "",
              guardians: [DEFAULT_GUARDIAN],
              currentEnrollment: EMPTY_CURRENT_ENROLLMENT,
            }}
            errorMessage={createStudentError?.message}
            isPending={createStudentMutation.isPending}
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.STUDENTS, location.search));
            }}
            onSubmit={handleSubmit}
            submitLabel="Create student"
          />
        </CardContent>
      </Card>
    </div>
  );
}
