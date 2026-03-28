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
  useAdmissionEnquiryQuery,
  useCreateAdmissionEnquiryMutation,
  useUpdateAdmissionEnquiryMutation,
} from "@/features/admissions/api/use-admissions";
import {
  ADMISSION_ENQUIRY_FORM_DEFAULT_VALUES,
  toAdmissionEnquiryMutationBody,
  type AdmissionEnquiryFormValues,
} from "@/features/admissions/model/admission-form-schema";
import { AdmissionEnquiryForm } from "@/features/admissions/ui/admission-enquiry-form";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type AdmissionEnquirySheetRouteProps = {
  mode: "create" | "edit";
};

export function AdmissionEnquirySheetRoute({
  mode,
}: AdmissionEnquirySheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { enquiryId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusName = session?.activeCampus?.name;
  const enquiryQuery = useAdmissionEnquiryQuery(
    institutionId,
    mode === "edit" ? enquiryId : undefined,
  );
  const createMutation = useCreateAdmissionEnquiryMutation(institutionId);
  const updateMutation = useUpdateAdmissionEnquiryMutation(institutionId);

  const defaultValues = useMemo<AdmissionEnquiryFormValues>(() => {
    if (mode === "create" || !enquiryQuery.data) {
      return ADMISSION_ENQUIRY_FORM_DEFAULT_VALUES;
    }

    return {
      studentName: enquiryQuery.data.studentName,
      guardianName: enquiryQuery.data.guardianName,
      mobile: enquiryQuery.data.mobile,
      email: enquiryQuery.data.email ?? "",
      source: enquiryQuery.data.source ?? "",
      status: enquiryQuery.data.status,
      notes: enquiryQuery.data.notes ?? "",
    };
  }, [enquiryQuery.data, mode]);

  async function handleSubmit(values: AdmissionEnquiryFormValues) {
    if (!institutionId) {
      return;
    }

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: toAdmissionEnquiryMutationBody(values),
        });
        toast.success(
          ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.ADMISSION_ENQUIRY),
        );
      } else if (enquiryId && enquiryQuery.data) {
        await updateMutation.mutateAsync({
          params: {
            path: {
              enquiryId,
            },
          },
          body: {
            ...toAdmissionEnquiryMutationBody(values),
          },
        });
        toast.success(
          ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ADMISSION_ENQUIRY),
        );
      }

      void navigate(
        appendSearch(ERP_ROUTES.ADMISSIONS_ENQUIRIES, location.search),
      );
    } catch (error) {
      toast.error(extractApiError(error, "Could not save admission enquiry. Please try again."));
    }
  }

  if (mode === "edit" && enquiryQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ADMISSIONS_ENQUIRIES}
        description="Load the enquiry details before editing."
        title="Edit admission enquiry"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading enquiry details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !enquiryQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ADMISSIONS_ENQUIRIES}
        description="The requested enquiry could not be loaded for this institution."
        title="Enquiry not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Enquiry not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the enquiries list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((updateMutation.error as Error | null | undefined)?.message ??
        undefined);

  const isPending =
    mode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.ADMISSIONS_ENQUIRIES}
      description={
        mode === "create"
          ? "Record a new lead in the admissions pipeline."
          : "Update this admissions enquiry."
      }
      title={
        mode === "create" ? "New admission enquiry" : "Edit admission enquiry"
      }
    >
      <AdmissionEnquiryForm
        campusName={activeCampusName}
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.ADMISSIONS_ENQUIRIES, location.search),
          );
        }}
        onSubmit={handleSubmit}
        submitLabel={mode === "create" ? "Create enquiry" : "Save changes"}
      />
    </RouteEntitySheet>
  );
}
