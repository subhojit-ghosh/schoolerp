import { useMemo } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import {
  IconPencil,
  IconToggleLeft,
  IconToggleRight,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/ui/table";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityDetailPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES, buildSalaryTemplateEditRoute } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useSalaryTemplateDetailQuery,
  useUpdateSalaryTemplateStatusMutation,
} from "@/features/payroll/api/use-payroll";
import {
  formatPaiseToRupees,
  formatBasisPointsToPercent,
} from "@/features/payroll/model/payroll-formatters";

type TemplateComponent = {
  id: string;
  salaryComponentName: string;
  salaryComponentType: "earning" | "deduction";
  calculationType: "fixed" | "percentage";
  amountInPaise: number | null;
  percentage: number | null;
  sortOrder: number;
};

export function SalaryTemplateDetailPage() {
  const { templateId } = useParams();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);
  const canManagePayroll = hasPermission(session, PERMISSIONS.PAYROLL_MANAGE);

  const templateQuery = useSalaryTemplateDetailQuery(
    canReadPayroll,
    templateId,
  );
  const statusMutation = useUpdateSalaryTemplateStatusMutation();

  const template = templateQuery.data as
    | {
        id: string;
        name: string;
        description: string | null;
        status: "active" | "archived";
        components: TemplateComponent[];
        createdAt: string;
      }
    | undefined;

  useDocumentTitle(template?.name ?? "Salary Template");

  const components = useMemo(
    () => (template?.components ?? []) as TemplateComponent[],
    [template?.components],
  );

  async function handleToggleStatus() {
    if (!template || !templateId) return;
    const newStatus = template.status === "active" ? "archived" : "active";
    try {
      await statusMutation.mutateAsync({
        params: { path: { templateId } },
        body: { status: newStatus },
      });
      toast.success(
        newStatus === "active"
          ? "Salary template activated."
          : "Salary template archived.",
      );
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not update salary template status. Please try again.",
        ),
      );
    }
  }

  if (templateQuery.isLoading) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-8 text-center text-sm text-muted-foreground">
          Loading...
        </div>
      </EntityPageShell>
    );
  }

  if (!template) {
    return (
      <EntityPageShell width="full">
        <div className="border rounded-lg bg-card p-12 text-center">
          <p className="font-medium">Template not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            The salary template you are looking for does not exist.
          </p>
        </div>
      </EntityPageShell>
    );
  }

  return (
    <EntityPageShell width="full">
      <EntityDetailPageHeader
        backAction={
          <Breadcrumbs
            items={[
              {
                label: "Salary Templates",
                href: ERP_ROUTES.PAYROLL_SALARY_TEMPLATES,
              },
              { label: template.name },
            ]}
          />
        }
        title={template.name}
        badges={
          template.status === "active" ? (
            <Badge variant="outline">Active</Badge>
          ) : (
            <Badge variant="secondary">Archived</Badge>
          )
        }
        meta={template.description}
        actions={
          canManagePayroll ? (
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link to={buildSalaryTemplateEditRoute(templateId!)}>
                  <IconPencil className="size-4" />
                  Edit
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void handleToggleStatus()}
              >
                {template.status === "active" ? (
                  <>
                    <IconToggleRight className="size-4" />
                    Archive
                  </>
                ) : (
                  <>
                    <IconToggleLeft className="size-4" />
                    Activate
                  </>
                )}
              </Button>
            </div>
          ) : undefined
        }
      />

      <section className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h2 className="text-sm font-medium">
            Components ({components.length})
          </h2>
        </div>

        {components.length === 0 ? (
          <div className="flex min-h-32 items-center justify-center p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No components configured for this template.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Name
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Type
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground">
                    Calculation
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Amount / Percentage
                  </TableHead>
                  <TableHead className="h-10 text-xs font-medium text-muted-foreground text-right">
                    Order
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {components.map((comp) => (
                  <TableRow key={comp.id}>
                    <TableCell className="font-medium text-sm">
                      {comp.salaryComponentName}
                    </TableCell>
                    <TableCell>
                      {comp.salaryComponentType === "earning" ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-200">
                          Earning
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Deduction</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm capitalize">
                      {comp.calculationType}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {comp.calculationType === "percentage"
                        ? comp.percentage != null
                          ? formatBasisPointsToPercent(comp.percentage)
                          : "-"
                        : comp.amountInPaise != null
                          ? formatPaiseToRupees(comp.amountInPaise)
                          : "-"}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {comp.sortOrder}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </EntityPageShell>
  );
}
