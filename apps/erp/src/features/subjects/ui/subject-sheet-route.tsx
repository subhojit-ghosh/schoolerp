import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateSubjectMutation,
  useSubjectQuery,
  useUpdateSubjectMutation,
} from "@/features/subjects/api/use-subjects";
import type { SubjectFormValues } from "@/features/subjects/model/subject-form-schema";
import { SubjectForm } from "@/features/subjects/ui/subject-form";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_SUBJECT_FORM_VALUES: SubjectFormValues = {
  name: "",
  code: "",
};

type SubjectSheetRouteProps = {
  mode: "create" | "edit";
};

export function SubjectSheetRoute({ mode }: SubjectSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const subjectQuery = useSubjectQuery(
    mode === "edit" && Boolean(institutionId),
    subjectId,
  );
  const createSubjectMutation = useCreateSubjectMutation();
  const updateSubjectMutation = useUpdateSubjectMutation();

  const defaultValues = useMemo<SubjectFormValues>(() => {
    if (mode === "create" || !subjectQuery.data) {
      return DEFAULT_SUBJECT_FORM_VALUES;
    }

    return {
      name: subjectQuery.data.name,
      code: subjectQuery.data.code ?? "",
    };
  }, [mode, subjectQuery.data]);

  async function handleSubmit(values: SubjectFormValues) {
    if (!institutionId) {
      return;
    }

    if (mode === "create") {
      await createSubjectMutation.mutateAsync({
        body: {
          code: values.code || undefined,
          name: values.name,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.SUBJECT));
    } else if (subjectId) {
      await updateSubjectMutation.mutateAsync({
        params: {
          path: {
            subjectId,
          },
        },
        body: {
          code: values.code || undefined,
          name: values.name,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.SUBJECT));
    }

    void navigate(appendSearch(ERP_ROUTES.SUBJECTS, location.search));
  }

  if (mode === "edit" && subjectQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.SUBJECTS}
        description="Load the subject details before editing."
        title="Edit subject"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading subject details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !subjectQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.SUBJECTS}
        description="The requested subject could not be loaded for this institution."
        title="Subject not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Subject not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the subjects list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createSubjectMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateSubjectMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create"
      ? createSubjectMutation.isPending
      : updateSubjectMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.SUBJECTS}
      description={
        mode === "create"
          ? "Create a new subject for your campus."
          : "Update subject details."
      }
      title={mode === "create" ? "New subject" : "Edit subject"}
    >
      <SubjectForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(appendSearch(ERP_ROUTES.SUBJECTS, location.search));
        }}
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create subject" : "Save changes"}
      />
    </RouteEntitySheet>
  );
}
