import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateSalaryAssignmentMutation,
  useSalaryAssignmentDetailQuery,
  useSalaryTemplatesQuery,
  useUpdateSalaryAssignmentMutation,
} from "@/features/payroll/api/use-payroll";
import {
  SALARY_ASSIGNMENT_DEFAULT_VALUES,
  type SalaryAssignmentFormValues,
} from "@/features/payroll/model/salary-assignment-form-schema";
import { SalaryAssignmentForm } from "@/features/payroll/ui/salary-assignment-form";
import { appendSearch } from "@/lib/routes";

type SalaryAssignmentSheetRouteProps = {
  mode: "create" | "edit";
};

export function SalaryAssignmentSheetRoute({ mode }: SalaryAssignmentSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { assignmentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);

  const assignmentQuery = useSalaryAssignmentDetailQuery(
    mode === "edit" && canReadPayroll,
    assignmentId,
  );
  const templatesQuery = useSalaryTemplatesQuery(canReadPayroll, {
    limit: 200,
    sort: "name",
    order: "asc",
  });
  const createMutation = useCreateSalaryAssignmentMutation();
  const updateMutation = useUpdateSalaryAssignmentMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.PAYROLL_SALARY_ASSIGNMENTS, location.search),
    [location.search],
  );

  const templateOptions = useMemo(() => {
    const rows = (templatesQuery.data as { rows?: unknown[] } | undefined)?.rows ?? templatesQuery.data;
    if (!Array.isArray(rows)) return [];
    return (rows as Array<Record<string, unknown>>)
      .filter((t) => t.status === "active")
      .map((t) => ({
        id: t.id as string,
        name: t.name as string,
      }));
  }, [templatesQuery.data]);

  // Staff options would come from a staff list query
  // For now we provide an empty array; the staff select will be populated
  // when staff list APIs are integrated
  const staffOptions = useMemo(() => {
    return [] as Array<{ id: string; name: string; employeeId: string | null }>;
  }, []);

  const editingAssignment = assignmentQuery.data as
    | {
        id: string;
        staffProfileId: string;
        salaryTemplateId: string;
        effectiveFrom: string;
        staffName?: string;
      }
    | undefined;

  const defaultValues = useMemo<SalaryAssignmentFormValues>(() => {
    if (mode === "create" || !editingAssignment) {
      return SALARY_ASSIGNMENT_DEFAULT_VALUES;
    }
    return {
      staffProfileId: editingAssignment.staffProfileId,
      salaryTemplateId: editingAssignment.salaryTemplateId,
      effectiveFrom: editingAssignment.effectiveFrom,
    };
  }, [editingAssignment, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: SalaryAssignmentFormValues) {
    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          staffProfileId: values.staffProfileId,
          salaryTemplateId: values.salaryTemplateId,
          effectiveFrom: values.effectiveFrom,
        },
      });
      toast.success("Salary assignment created.");
      void navigate(closeTo);
    } else if (assignmentId) {
      await updateMutation.mutateAsync({
        params: { path: { assignmentId } },
        body: {
          effectiveFrom: values.effectiveFrom,
        },
      });
      toast.success("Salary assignment updated.");
      void navigate(closeTo);
    }
  }

  const title = mode === "create" ? "New assignment" : "Edit assignment";
  const description =
    mode === "create"
      ? "Assign a salary template to a staff member."
      : (editingAssignment?.staffName as string) ?? "Edit this salary assignment.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <SalaryAssignmentForm
        mode={mode}
        defaultValues={defaultValues}
        staffOptions={staffOptions}
        templateOptions={templateOptions}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create assignment" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
