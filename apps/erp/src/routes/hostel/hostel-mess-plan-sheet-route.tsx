import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateMessPlanMutation,
  useMessPlansQuery,
  useUpdateMessPlanMutation,
} from "@/features/hostel/api/use-hostel";
import {
  MESS_PLAN_DEFAULT_VALUES,
  type MessPlanFormValues,
} from "@/features/hostel/model/mess-plan-form-schema";
import { MessPlanForm } from "@/features/hostel/ui/mess-plan-form";
import { appendSearch } from "@/lib/routes";

type HostelMessPlanSheetRouteProps = {
  mode: "create" | "edit";
};

export function HostelMessPlanSheetRoute({
  mode,
}: HostelMessPlanSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { planId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const messPlansQuery = useMessPlansQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateMessPlanMutation();
  const updateMutation = useUpdateMessPlanMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.HOSTEL_MESS_PLANS, location.search),
    [location.search],
  );

  const rows =
    (messPlansQuery.data as { rows?: unknown[] } | undefined)?.rows ??
    messPlansQuery.data;
  const editingPlan = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === planId)
    : undefined;

  const defaultValues = useMemo<MessPlanFormValues>(() => {
    if (mode === "create" || !editingPlan) {
      return MESS_PLAN_DEFAULT_VALUES;
    }
    return {
      name: editingPlan.name as string,
      monthlyFeeInPaise: (editingPlan.monthlyFeeInPaise as number) ?? 0,
      description: (editingPlan.description as string) ?? "",
    };
  }, [editingPlan, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: MessPlanFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            monthlyFeeInPaise: values.monthlyFeeInPaise,
            description: values.description || undefined,
          },
        });
        toast.success("Mess plan created.");
        void navigate(closeTo);
      } else if (planId) {
        await updateMutation.mutateAsync({
          params: { path: { planId } },
          body: {
            name: values.name,
            monthlyFeeInPaise: values.monthlyFeeInPaise,
            description: values.description || null,
          },
        });
        toast.success("Mess plan updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save mess plan. Please try again."),
      );
    }
  }

  const title = mode === "create" ? "New mess plan" : "Edit mess plan";
  const description =
    mode === "create"
      ? "Add a new mess plan."
      : ((editingPlan?.name as string) ?? "Edit this mess plan.");

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <MessPlanForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create mess plan" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
