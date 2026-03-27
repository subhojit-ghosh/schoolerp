import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateSalaryComponentMutation,
  useSalaryComponentsQuery,
  useUpdateSalaryComponentMutation,
} from "@/features/payroll/api/use-payroll";
import {
  SALARY_COMPONENT_DEFAULT_VALUES,
  type SalaryComponentFormValues,
} from "@/features/payroll/model/salary-component-form-schema";
import { SalaryComponentForm } from "@/features/payroll/ui/salary-component-form";
import { appendSearch } from "@/lib/routes";

type SalaryComponentSheetRouteProps = {
  mode: "create" | "edit";
};

export function SalaryComponentSheetRoute({ mode }: SalaryComponentSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { componentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const componentsQuery = useSalaryComponentsQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateSalaryComponentMutation();
  const updateMutation = useUpdateSalaryComponentMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.PAYROLL_SALARY_COMPONENTS, location.search),
    [location.search],
  );

  const rows = (componentsQuery.data as { rows?: unknown[] } | undefined)?.rows ?? componentsQuery.data;
  const editingComponent = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === componentId)
    : undefined;

  const defaultValues = useMemo<SalaryComponentFormValues>(() => {
    if (mode === "create" || !editingComponent) {
      return SALARY_COMPONENT_DEFAULT_VALUES;
    }
    return {
      name: editingComponent.name as string,
      type: editingComponent.type as "earning" | "deduction",
      calculationType: editingComponent.calculationType as "fixed" | "percentage",
      isTaxable: editingComponent.isTaxable as boolean,
      isStatutory: editingComponent.isStatutory as boolean,
      sortOrder: (editingComponent.sortOrder as number) ?? 0,
    };
  }, [editingComponent, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: SalaryComponentFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          name: values.name,
          type: values.type,
          calculationType: values.calculationType,
          isTaxable: values.isTaxable,
          isStatutory: values.isStatutory,
          sortOrder: values.sortOrder,
        },
      });
      toast.success("Salary component created.");
      void navigate(closeTo);
    } else if (componentId) {
      await updateMutation.mutateAsync({
        params: { path: { componentId } },
        body: {
          name: values.name,
          type: values.type,
          calculationType: values.calculationType,
          isTaxable: values.isTaxable,
          isStatutory: values.isStatutory,
          sortOrder: values.sortOrder,
        },
      });
      toast.success("Salary component updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New component" : "Edit component";
  const description =
    mode === "create"
      ? "Define an earning or deduction component."
      : (editingComponent?.name as string) ?? "Edit this salary component.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <SalaryComponentForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create component" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
