import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateHomeworkMutation,
  useHomeworkDetailQuery,
  useUpdateHomeworkMutation,
} from "@/features/homework/api/use-homework";
import {
  DEFAULT_HOMEWORK_FORM_VALUES,
  type HomeworkFormValues,
} from "@/features/homework/model/homework-form-schema";
import { HomeworkForm } from "@/features/homework/ui/homework-form";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";

type HomeworkSheetRouteProps = {
  mode: "create" | "edit";
};

export function HomeworkSheetRoute({ mode }: HomeworkSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { homeworkId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const detailQuery = useHomeworkDetailQuery(
    mode === "edit" && Boolean(institutionId),
    homeworkId,
  );
  const createMutation = useCreateHomeworkMutation();
  const updateMutation = useUpdateHomeworkMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.HOMEWORK, location.search),
    [location.search],
  );

  const defaultValues = useMemo<HomeworkFormValues>(() => {
    if (mode === "create" || !detailQuery.data) {
      return DEFAULT_HOMEWORK_FORM_VALUES;
    }
    return {
      classId: detailQuery.data.classId,
      sectionId: detailQuery.data.sectionId,
      subjectId: detailQuery.data.subjectId,
      title: detailQuery.data.title,
      description: detailQuery.data.description ?? "",
      attachmentInstructions: detailQuery.data.attachmentInstructions ?? "",
      dueDate: detailQuery.data.dueDate,
    };
  }, [detailQuery.data, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: HomeworkFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            classId: values.classId,
            sectionId: values.sectionId,
            subjectId: values.subjectId,
            title: values.title,
            description: values.description || undefined,
            attachmentInstructions: values.attachmentInstructions || undefined,
            dueDate: values.dueDate,
          },
        });
        toast.success("Homework created.");
      } else if (homeworkId) {
        await updateMutation.mutateAsync({
          params: { path: { homeworkId } },
          body: {
            classId: values.classId,
            sectionId: values.sectionId,
            subjectId: values.subjectId,
            title: values.title,
            description: values.description || null,
            attachmentInstructions: values.attachmentInstructions || null,
            dueDate: values.dueDate,
          },
        });
        toast.success("Homework updated.");
      }
      void navigate(closeTo);
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save homework. Please try again."),
      );
    }
  }

  const title = mode === "create" ? "New homework" : "Edit homework";
  const description =
    mode === "edit" && detailQuery.data
      ? `${detailQuery.data.className} · ${detailQuery.data.sectionName} · ${detailQuery.data.subjectName}`
      : "Create a new homework assignment for a class.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      {mode === "edit" && detailQuery.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <HomeworkForm
          defaultValues={defaultValues}
          errorMessage={errorMessage}
          isPending={isPending}
          submitLabel={mode === "create" ? "Create homework" : "Save changes"}
          onCancel={() => void navigate(closeTo)}
          onSubmit={handleSubmit}
        />
      )}
    </RouteEntitySheet>
  );
}
