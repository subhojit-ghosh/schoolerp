import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import {
  useClassQuery,
  useCreateClassMutation,
  useUpdateClassMutation,
} from "@/features/classes/api/use-classes";
import type { ClassFormValues } from "@/features/classes/model/class-form-schema";
import { ClassForm } from "@/features/classes/ui/class-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_CLASS_FORM_VALUES: ClassFormValues = {
  name: "",
  sections: [{ name: "" }],
};

type ClassSheetRouteProps = {
  mode: "create" | "edit";
};

export function ClassSheetRoute({ mode }: ClassSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { classId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id;
  const classQuery = useClassQuery(
    mode === "edit" && Boolean(institutionId),
    classId,
  );
  const createClassMutation = useCreateClassMutation();
  const updateClassMutation = useUpdateClassMutation();

  const defaultValues = useMemo<ClassFormValues>(() => {
    if (mode === "create" || !classQuery.data) {
      return DEFAULT_CLASS_FORM_VALUES;
    }

    return {
      name: classQuery.data.name,
      sections: classQuery.data.sections.map((section) => ({
        id: section.id,
        name: section.name,
      })),
    };
  }, [classQuery.data, mode]);

  async function handleSubmit(values: ClassFormValues) {
    if (!institutionId || !activeCampusId) {
      return;
    }

    if (mode === "create") {
      await createClassMutation.mutateAsync({
        body: {
          ...values,
          campusId: activeCampusId,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.CLASS));
    } else if (classId) {
      await updateClassMutation.mutateAsync({
        params: {
          path: {
            classId,
          },
        },
        body: {
          ...values,
          campusId: activeCampusId,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.CLASS));
    }

    void navigate(appendSearch(ERP_ROUTES.CLASSES, location.search));
  }

  if (mode === "edit" && classQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.CLASSES}
        description="Load the class details before editing its sections."
        title="Edit class"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading class details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !classQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.CLASSES}
        description="The requested class could not be loaded for this institution."
        title="Class not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Class not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the classes list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createClassMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateClassMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create"
      ? createClassMutation.isPending
      : updateClassMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.CLASSES}
      description={
        mode === "create"
          ? "Add a class and define the sections available for admissions and roster views."
          : "Update the class name or reconcile its sections."
      }
      title={mode === "create" ? "Add class" : "Edit class"}
    >
      <ClassForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(appendSearch(ERP_ROUTES.CLASSES, location.search));
        }}
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create class" : "Save changes"}
      />
    </RouteEntitySheet>
  );
}
