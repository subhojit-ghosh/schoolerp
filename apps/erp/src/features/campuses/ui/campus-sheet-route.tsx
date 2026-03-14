import { useLocation, useNavigate } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useCreateCampusMutation } from "@/features/campuses/api/use-campuses";
import {
  toCampusMutationBody,
  type CampusFormValues,
} from "@/features/campuses/model/campus-form-schema";
import { CampusForm } from "@/features/campuses/ui/campus-form";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_CAMPUS_FORM_VALUES: CampusFormValues = {
  name: "",
  slug: "",
  code: "",
  isDefault: false,
};

export function CampusSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const createCampusMutation = useCreateCampusMutation();

  async function handleSubmit(values: CampusFormValues) {
    if (!institutionId) {
      return;
    }

    await createCampusMutation.mutateAsync({
      body: toCampusMutationBody(values),
    });
    toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.CAMPUS));
    void navigate(appendSearch(ERP_ROUTES.SETTINGS_CAMPUSES, location.search));
  }

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.SETTINGS_CAMPUSES}
      description="Create a new campus so staff can switch into it and define local operations."
      title="Create campus"
    >
      <CampusForm
        defaultValues={DEFAULT_CAMPUS_FORM_VALUES}
        errorMessage={
          (createCampusMutation.error as Error | null | undefined)?.message ??
          undefined
        }
        isPending={createCampusMutation.isPending}
        onCancel={() => {
          void navigate(
            appendSearch(ERP_ROUTES.SETTINGS_CAMPUSES, location.search),
          );
        }}
        onSubmit={handleSubmit}
        submitLabel="Create campus"
      />
    </RouteEntitySheet>
  );
}
