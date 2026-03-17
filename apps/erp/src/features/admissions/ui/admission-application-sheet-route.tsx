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
  useAdmissionApplicationQuery,
  useAdmissionEnquiriesQuery,
  useCreateAdmissionApplicationMutation,
  useUpdateAdmissionApplicationMutation,
} from "@/features/admissions/api/use-admissions";
import {
  ADMISSION_APPLICATION_FORM_DEFAULT_VALUES,
  toAdmissionApplicationMutationBody,
  type AdmissionApplicationFormValues,
} from "@/features/admissions/model/admission-form-schema";
import { AdmissionApplicationForm } from "@/features/admissions/ui/admission-application-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

type AdmissionApplicationSheetRouteProps = {
  mode: "create" | "edit";
};

type EnquiryDraft = {
  campusId: string;
  email: string;
  guardianName: string;
  id: string;
  mobile: string;
  studentName: string;
};

export function AdmissionApplicationSheetRoute({
  mode,
}: AdmissionApplicationSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusId = session?.activeCampus?.id ?? "";
  const applicationQuery = useAdmissionApplicationQuery(
    institutionId,
    mode === "edit" ? applicationId : undefined,
  );
  const enquiriesQuery = useAdmissionEnquiriesQuery(institutionId, {
    limit: 50,
    page: 1,
    sort: "createdAt",
    order: "desc",
  });
  const campusesQuery = useCampusesQuery(institutionId, {
    limit: 50,
    page: 1,
    sort: "name",
    order: "asc",
  });
  const createMutation = useCreateAdmissionApplicationMutation(institutionId);
  const updateMutation = useUpdateAdmissionApplicationMutation(institutionId);

  const defaultValues = useMemo<AdmissionApplicationFormValues>(() => {
    if (mode === "create" || !applicationQuery.data) {
      return {
        ...ADMISSION_APPLICATION_FORM_DEFAULT_VALUES,
        campusId: activeCampusId,
      };
    }

    return {
      enquiryId: applicationQuery.data.enquiryId ?? "",
      campusId: applicationQuery.data.campusId,
      studentFirstName: applicationQuery.data.studentFirstName,
      studentLastName: applicationQuery.data.studentLastName ?? "",
      guardianName: applicationQuery.data.guardianName,
      mobile: applicationQuery.data.mobile,
      email: applicationQuery.data.email ?? "",
      desiredClassName: applicationQuery.data.desiredClassName ?? "",
      desiredSectionName: applicationQuery.data.desiredSectionName ?? "",
      status: applicationQuery.data.status,
      notes: applicationQuery.data.notes ?? "",
    };
  }, [activeCampusId, applicationQuery.data, mode]);

  const campusOptions = useMemo(
    () =>
      (campusesQuery.data?.rows ?? []).map((campus) => ({
        id: campus.id,
        name: campus.name,
      })),
    [campusesQuery.data?.rows],
  );

  const enquiryOptions = useMemo(
    () =>
      (enquiriesQuery.data?.rows ?? []).map((enquiry) => ({
        campusId: enquiry.campusId,
        email: enquiry.email ?? "",
        guardianName: enquiry.guardianName,
        id: enquiry.id,
        mobile: enquiry.mobile,
        studentName: enquiry.studentName,
      })),
    [enquiriesQuery.data?.rows],
  ) as EnquiryDraft[];

  async function handleSubmit(values: AdmissionApplicationFormValues) {
    if (!institutionId) {
      return;
    }

    if (mode === "create") {
      await createMutation.mutateAsync({
        body: toAdmissionApplicationMutationBody(values),
      });
      toast.success(
        ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.ADMISSION_APPLICATION),
      );
    } else if (applicationId) {
      await updateMutation.mutateAsync({
        params: {
          path: {
            applicationId,
          },
        },
        body: toAdmissionApplicationMutationBody(values),
      });
      toast.success(
        ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.ADMISSION_APPLICATION),
      );
    }

    void navigate(appendSearch(ERP_ROUTES.ADMISSIONS_APPLICATIONS, location.search));
  }

  if (mode === "edit" && applicationQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
        description="Load the application details before editing."
        title="Edit admission application"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading application details...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (mode === "edit" && !applicationQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
        description="The requested application could not be loaded for this institution."
        title="Application not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Application not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Try returning to the applications list and opening the record again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createMutation.error as Error | null | undefined)?.message ?? undefined)
      : ((updateMutation.error as Error | null | undefined)?.message ?? undefined);

  const isPending = mode === "create" ? createMutation.isPending : updateMutation.isPending;

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.ADMISSIONS_APPLICATIONS}
      description={
        mode === "create"
          ? "Create a new admission application."
          : "Update this admission application."
      }
      title={
        mode === "create"
          ? "New admission application"
          : "Edit admission application"
      }
    >
      <AdmissionApplicationForm
        campuses={campusOptions}
        defaultValues={defaultValues}
        enquiries={enquiryOptions}
        enableLinkedEnquiryAutofill={mode === "create"}
        errorMessage={errorMessage}
        isPending={isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.ADMISSIONS_APPLICATIONS, location.search),
          );
        }}
        onSubmit={handleSubmit}
        submitLabel={
          mode === "create" ? "Create application" : "Save changes"
        }
      />
    </RouteEntitySheet>
  );
}
