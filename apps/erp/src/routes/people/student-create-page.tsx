import { useCallback, useRef, useState } from "react";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  GUARDIAN_RELATIONSHIPS,
} from "@repo/contracts";
import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
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
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ERP_ROUTES } from "@/constants/routes";
import { useAdmissionFormFieldsQuery } from "@/features/admissions/api/use-admissions";
import {
  filterAdmissionFormFieldsForScope,
  normalizeCustomFieldValues,
} from "@/features/admissions/model/admission-custom-fields";
import { useCreateStudentMutation } from "@/features/students/api/use-students";
import {
  EMPTY_CURRENT_ENROLLMENT,
  toStudentMutationBody,
  type StudentFormValues,
} from "@/features/students/model/student-form-schema";
import { StudentForm } from "@/features/students/ui/student-form";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { UnsavedChangesDialog } from "@/components/feedback/unsaved-changes-dialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_GUARDIAN = {
  name: "",
  mobile: "",
  email: "",
  relationship: GUARDIAN_RELATIONSHIPS.GUARDIAN,
  isPrimary: true,
};

const STUDENT_CREATE_AUTO_SAVE_KEY = "student-create";

export function StudentCreatePage() {
  useDocumentTitle("New Student");
  const [isDirty, setIsDirty] = useState(false);
  const clearDraftRef = useRef<(() => void) | null>(null);
  const handleAutoSaveReady = useCallback((clearDraft: () => void) => {
    clearDraftRef.current = clearDraft;
  }, []);
  const blocker = useUnsavedChangesGuard(isDirty);
  const location = useLocation();
  const navigate = useNavigate();
  const authSession = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(authSession);
  const institutionId = authSession?.activeOrganization?.id;
  const canManageStudents = isStaffContext(authSession);
  const managedInstitutionId = canManageStudents ? institutionId : undefined;
  const activeCampusName = authSession?.activeCampus?.name;
  const academicYearsQuery = useAcademicYearsQuery(managedInstitutionId);
  const formFieldsQuery = useAdmissionFormFieldsQuery(
    managedInstitutionId,
    ADMISSION_FORM_FIELD_SCOPES.STUDENT,
  );
  const createStudentMutation = useCreateStudentMutation(managedInstitutionId);
  const createStudentError = createStudentMutation.error as
    | Error
    | null
    | undefined;
  const customFields = filterAdmissionFormFieldsForScope(
    formFieldsQuery.data?.rows ?? [],
    "student",
  );

  async function handleSubmit(values: StudentFormValues) {
    if (!institutionId) {
      return;
    }

    try {
      await createStudentMutation.mutateAsync({
        body: toStudentMutationBody(values),
      });
      clearDraftRef.current?.();
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.STUDENT));
      void navigate(appendSearch(ERP_ROUTES.STUDENTS, location.search));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not create student. Please try again."),
      );
    }
  }

  if (!institutionId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Sign in with an institution-backed session before managing student
            records.
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
    <EntityPageShell width="form">
      <EntityPageHeader
        backAction={
          <Breadcrumbs
            items={[
              {
                label: "Students",
                href: appendSearch(ERP_ROUTES.STUDENTS, location.search),
              },
              { label: "New Student" },
            ]}
          />
        }
        description={`Add student details and link guardians for ${
          activeCampusName ?? "the selected campus"
        }.`}
        title="New Student"
      />

      <Card className="w-full">
        <CardContent className="pt-6">
          <StudentForm
            academicYears={academicYearsQuery.data?.rows ?? []}
            autoSaveKey={STUDENT_CREATE_AUTO_SAVE_KEY}
            campusId={authSession?.activeCampus?.id}
            campusName={activeCampusName}
            customFields={customFields}
            defaultValues={{
              admissionNumber: "",
              firstName: "",
              lastName: "",
              classId: "",
              sectionId: "",
              guardians: [DEFAULT_GUARDIAN],
              customFieldValues: normalizeCustomFieldValues(customFields),
              currentEnrollment: EMPTY_CURRENT_ENROLLMENT,
            }}
            errorMessage={createStudentError?.message}
            institutionId={managedInstitutionId}
            isPending={createStudentMutation.isPending}
            mode="create"
            onAutoSaveReady={handleAutoSaveReady}
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.STUDENTS, location.search));
            }}
            onDirtyChange={setIsDirty}
            onSubmit={handleSubmit}
            submitLabel="Create student"
          />
        </CardContent>
      </Card>

      <UnsavedChangesDialog blocker={blocker} />
    </EntityPageShell>
  );
}
