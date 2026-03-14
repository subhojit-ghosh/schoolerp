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
import {
  useAcademicYearQuery,
  useCreateAcademicYearMutation,
  useUpdateAcademicYearMutation,
} from "@/features/academic-years/api/use-academic-years";
import {
  ACADEMIC_YEAR_FORM_DEFAULT_VALUES,
  type AcademicYearFormValues,
} from "@/features/academic-years/model/academic-year-form-schema";
import { AcademicYearForm } from "@/features/academic-years/ui/academic-year-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type AcademicYearSheetRouteProps = {
  mode: "create" | "edit";
};

export function AcademicYearSheetRoute({ mode }: AcademicYearSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { academicYearId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const academicYearQuery = useAcademicYearQuery(
    institutionId,
    mode === "edit" ? academicYearId : undefined,
  );
  const createAcademicYearMutation =
    useCreateAcademicYearMutation(institutionId);
  const updateAcademicYearMutation =
    useUpdateAcademicYearMutation(institutionId);

  const defaultValues = useMemo<AcademicYearFormValues>(() => {
    if (mode === "create" || !academicYearQuery.data) {
      return ACADEMIC_YEAR_FORM_DEFAULT_VALUES;
    }

    return {
      name: academicYearQuery.data.name,
      startDate: academicYearQuery.data.startDate,
      endDate: academicYearQuery.data.endDate,
      isCurrent: academicYearQuery.data.isCurrent,
    };
  }, [academicYearQuery.data, mode]);

  async function handleSubmit(values: AcademicYearFormValues) {
    if (!institutionId) {
      return;
    }

    if (mode === "create") {
      await createAcademicYearMutation.mutateAsync({
        body: values,
      });
      toast.success(
        ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.ACADEMIC_YEAR),
      );
    } else if (academicYearId) {
      await updateAcademicYearMutation.mutateAsync({
        params: {
          path: {
            academicYearId,
          },
        },
        body: values,
      });
      toast.success(
        ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ACADEMIC_YEAR),
      );
    }

    void navigate(appendSearch(ERP_ROUTES.ACADEMIC_YEARS, location.search));
  }

  if (mode === "edit" && academicYearQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ACADEMIC_YEARS}
        description="Load the academic year details before editing."
        title="Edit academic year"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading academic year details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !academicYearQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ACADEMIC_YEARS}
        description="The requested academic year could not be loaded for this institution."
        title="Academic year not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Academic year not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createAcademicYearMutation.error as Error | null | undefined)
          ?.message ?? undefined)
      : ((updateAcademicYearMutation.error as Error | null | undefined)
          ?.message ?? undefined);

  const isPending =
    mode === "create"
      ? createAcademicYearMutation.isPending
      : updateAcademicYearMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.ACADEMIC_YEARS}
      description={
        mode === "create"
          ? "Create a new academic year for this institution."
          : "Update the selected academic year. The backend keeps the current-year rule authoritative."
      }
      title={mode === "create" ? "Create academic year" : "Edit academic year"}
    >
      <AcademicYearForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.ACADEMIC_YEARS, location.search),
          );
        }}
        onSubmit={handleSubmit}
        submitLabel={
          mode === "create" ? "Create academic year" : "Save changes"
        }
      />
    </RouteEntitySheet>
  );
}
