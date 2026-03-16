import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { IconChevronLeft } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { buildFeeStructureEditRoute, ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import { useCampusesQuery } from "@/features/campuses/api/use-campuses";
import {
  useCreateNextFeeStructureVersionMutation,
  useCreateFeeStructureMutation,
  useFeeStructureQuery,
  useUpdateFeeStructureMutation,
} from "@/features/fees/api/use-fees";
import type { FeeStructureFormValues } from "@/features/fees/model/fee-form-schema";
import { FeeStructureForm } from "@/features/fees/ui/fee-structure-form";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_FEE_STRUCTURE_FORM_VALUES: FeeStructureFormValues = {
  academicYearId: "",
  campusId: "",
  name: "",
  description: "",
  scope: "institution",
  installments: [{ label: "Full payment", amount: "", dueDate: "" }],
};

type FeeStructureFormPageProps = {
  mode: "create" | "edit";
};

export function FeeStructureFormPage({ mode }: FeeStructureFormPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { feeStructureId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const academicYearsQuery = useAcademicYearsQuery(institutionId, { limit: 50 });
  const campusesQuery = useCampusesQuery(institutionId, { limit: 50 });
  const feeStructureQuery = useFeeStructureQuery(
    mode === "edit" && Boolean(institutionId),
    feeStructureId,
  );

  const createMutation = useCreateFeeStructureMutation();
  const updateMutation = useUpdateFeeStructureMutation();
  const createNextVersionMutation = useCreateNextFeeStructureVersionMutation();

  const academicYearOptions = useMemo(
    () =>
      (academicYearsQuery.data?.rows ?? [])
        .filter((academicYear) => academicYear.status === "active")
        .map((ay) => ({
          id: ay.id,
          name: ay.name,
        })),
    [academicYearsQuery.data?.rows],
  );

  const campusOptions = useMemo(
    () =>
      (campusesQuery.data?.rows ?? []).map((c) => ({
        id: c.id,
        name: c.name,
      })),
    [campusesQuery.data?.rows],
  );

  const defaultValues = useMemo<FeeStructureFormValues>(() => {
    if (mode === "create" || !feeStructureQuery.data) {
      return DEFAULT_FEE_STRUCTURE_FORM_VALUES;
    }

    const structure = feeStructureQuery.data;

    return {
      academicYearId: structure.academicYearId,
      campusId: structure.campusId ?? "",
      name: structure.name,
      description: structure.description ?? "",
      scope: structure.scope,
      installments:
        structure.installments.length > 0
          ? structure.installments.map((i) => ({
              label: i.label,
              amount: String(i.amountInPaise / 100),
              dueDate: i.dueDate,
            }))
          : [{ label: "Full payment", amount: "", dueDate: "" }],
    };
  }, [feeStructureQuery.data, mode]);

  async function handleSubmit(values: FeeStructureFormValues) {
    if (!institutionId) return;

    const isInstallmentLocked = Boolean(feeStructureQuery.data?.isInstallmentLocked);
    const installments = values.installments.map((i) => ({
      label: i.label,
      amount: Number(i.amount),
      dueDate: i.dueDate,
    }));

    if (mode === "create") {
      await createMutation.mutateAsync({
        body: {
          academicYearId: values.academicYearId,
          campusId: values.campusId || undefined,
          name: values.name,
          description: values.description || null,
          scope: values.scope,
          installments,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_STRUCTURE));
    } else if (feeStructureId) {
      if (isInstallmentLocked) {
        const nextVersion = await createNextVersionMutation.mutateAsync({
          params: { path: { feeStructureId } },
        });
        toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_STRUCTURE));
        void navigate(
          appendSearch(
            buildFeeStructureEditRoute(nextVersion.id),
            location.search,
          ),
        );
        return;
      }

      await updateMutation.mutateAsync({
        params: { path: { feeStructureId } },
        body: {
          name: values.name,
          description: values.description || null,
          installments,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_STRUCTURE));
    }

    void navigate(appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search));
  }

  if (mode === "edit" && feeStructureQuery.isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink location={location} />
        <Card className="max-w-5xl">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </div>
    );
  }

  if (mode === "edit" && !feeStructureQuery.data) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink location={location} />
        <Card className="max-w-5xl">
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Return to fee structures and try again.
          </CardContent>
        </Card>
      </div>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createMutation.error as Error | null | undefined)?.message ?? undefined)
      : ((feeStructureQuery.data?.isInstallmentLocked
          ? createNextVersionMutation.error
          : updateMutation.error) as Error | null | undefined)?.message ??
        undefined;

  const isPending = mode === "create"
    ? createMutation.isPending
    : feeStructureQuery.data?.isInstallmentLocked
      ? createNextVersionMutation.isPending
      : updateMutation.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="space-y-1">
        <BackLink location={location} />
        <h1 className="text-2xl font-semibold tracking-tight">
          {mode === "create" ? "New fee structure" : "Edit fee structure"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {mode === "create"
            ? "Define a fee category for an academic year."
            : "Update the fee structure details."}
        </p>
      </div>

      <Card className="max-w-5xl">
        <CardContent className="pt-6">
          <FeeStructureForm
            academicYears={academicYearOptions}
            campuses={campusOptions}
            defaultValues={defaultValues}
            errorMessage={errorMessage}
            isPending={isPending}
            isReadOnly={Boolean(feeStructureQuery.data?.isInstallmentLocked)}
            lockScope={mode === "edit"}
            lockReason={
              mode === "edit" ? (feeStructureQuery.data?.lockReason ?? undefined) : undefined
            }
            onCancel={() => {
              void navigate(appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search));
            }}
            onSubmit={handleSubmit}
            submitLabel={
              mode === "create"
                ? "Create fee structure"
                : feeStructureQuery.data?.isInstallmentLocked
                  ? "Create next version"
                  : "Save changes"
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function BackLink({ location }: { location: ReturnType<typeof useLocation> }) {
  return (
    <Button asChild className="-ml-3" size="sm" variant="ghost">
      <Link to={appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search)}>
        <IconChevronLeft data-icon="inline-start" />
        Back to fee structures
      </Link>
    </Button>
  );
}
