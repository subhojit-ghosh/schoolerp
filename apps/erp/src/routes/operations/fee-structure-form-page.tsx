import { useCallback, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { buildFeeStructureEditRoute, ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { useAcademicYearsQuery } from "@/features/academic-years/api/use-academic-years";
import {
  useCreateNextFeeStructureVersionMutation,
  useCreateFeeStructureMutation,
  useFeeStructureQuery,
  useUpdateFeeStructureMutation,
} from "@/features/fees/api/use-fees";
import type { FeeStructureFormValues } from "@/features/fees/model/fee-form-schema";
import { FeeStructureForm } from "@/features/fees/ui/fee-structure-form";
import { UnsavedChangesDialog } from "@/components/feedback/unsaved-changes-dialog";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

function buildDefaultFeeStructureFormValues(
  academicYearId: string,
): FeeStructureFormValues {
  return {
    academicYearId,
    name: "",
    description: "",
    scope: "institution",
    installments: [{ label: "Full payment", amount: "", dueDate: "" }],
  };
}

const EMPTY_ACADEMIC_YEAR_ID = "";

type FeeStructureFormPageProps = {
  mode: "create" | "edit";
};

function buildAutoSaveKey(
  mode: "create" | "edit",
  feeStructureId?: string,
): string {
  if (mode === "edit" && feeStructureId) {
    return `fee-structure-edit-${feeStructureId}`;
  }
  return "fee-structure-create";
}

export function FeeStructureFormPage({ mode }: FeeStructureFormPageProps) {
  useDocumentTitle(
    mode === "create" ? "New Fee Structure" : "Edit Fee Structure",
  );
  const [isDirty, setIsDirty] = useState(false);
  const blocker = useUnsavedChangesGuard(isDirty);
  const location = useLocation();
  const navigate = useNavigate();
  const { feeStructureId } = useParams();
  const clearDraftRef = useRef<(() => void) | null>(null);
  const handleAutoSaveReady = useCallback((clearDraft: () => void) => {
    clearDraftRef.current = clearDraft;
  }, []);
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;
  const activeCampusLabel = session?.activeCampus?.name;

  const academicYearsQuery = useAcademicYearsQuery(institutionId, {
    limit: 50,
  });
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

  const defaultValues = useMemo<FeeStructureFormValues>(() => {
    if (mode === "create" || !feeStructureQuery.data) {
      const activeAcademicYears = (academicYearsQuery.data?.rows ?? []).filter(
        (academicYear) => academicYear.status === "active",
      );
      const defaultAcademicYearId =
        activeAcademicYears.find((academicYear) => academicYear.isCurrent)
          ?.id ??
        activeAcademicYears[0]?.id ??
        EMPTY_ACADEMIC_YEAR_ID;

      return buildDefaultFeeStructureFormValues(defaultAcademicYearId);
    }

    const structure = feeStructureQuery.data;

    return {
      academicYearId: structure.academicYearId,
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
  }, [academicYearsQuery.data?.rows, feeStructureQuery.data, mode]);

  async function handleSubmit(values: FeeStructureFormValues) {
    if (!institutionId) return;

    const isInstallmentLocked = Boolean(
      feeStructureQuery.data?.isInstallmentLocked,
    );
    const installments = values.installments.map((i) => ({
      label: i.label,
      amount: Number(i.amount),
      dueDate: i.dueDate,
    }));

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            academicYearId: values.academicYearId,
            name: values.name,
            description: values.description || null,
            scope: values.scope,
            installments,
          },
        });
        clearDraftRef.current?.();
        toast.success(
          ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_STRUCTURE),
        );
      } else if (feeStructureId) {
        if (isInstallmentLocked) {
          const nextVersion = await createNextVersionMutation.mutateAsync({
            params: { path: { feeStructureId } },
          });
          clearDraftRef.current?.();
          toast.success(
            ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_STRUCTURE),
          );
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
        clearDraftRef.current?.();
        toast.success(
          ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_STRUCTURE),
        );
      }

      void navigate(appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search));
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not save fee structure. Please try again.",
        ),
      );
    }
  }

  if (mode === "edit" && feeStructureQuery.isLoading) {
    return (
      <EntityPageShell width="form">
        <FeeStructureBreadcrumbs label="Loading..." location={location} />
        <Card className="w-full">
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </EntityPageShell>
    );
  }

  if (mode === "edit" && !feeStructureQuery.data) {
    return (
      <EntityPageShell width="form">
        <FeeStructureBreadcrumbs label="Loading..." location={location} />
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Return to fee structures and try again.
          </CardContent>
        </Card>
      </EntityPageShell>
    );
  }

  const errorMessage =
    mode === "create"
      ? ((createMutation.error as Error | null | undefined)?.message ??
        undefined)
      : ((
          (feeStructureQuery.data?.isInstallmentLocked
            ? createNextVersionMutation.error
            : updateMutation.error) as Error | null | undefined
        )?.message ?? undefined);

  const isPending =
    mode === "create"
      ? createMutation.isPending
      : feeStructureQuery.data?.isInstallmentLocked
        ? createNextVersionMutation.isPending
        : updateMutation.isPending;

  return (
    <EntityPageShell width="form">
      <EntityPageHeader
        backAction={
          <FeeStructureBreadcrumbs
            label={
              mode === "create"
                ? "New Fee Structure"
                : `Edit ${feeStructureQuery.data?.name ?? "Fee Structure"}`
            }
            location={location}
          />
        }
        description={
          mode === "create"
            ? "Define a fee category for an academic year."
            : "Update the fee structure details."
        }
        title={mode === "create" ? "New fee structure" : "Edit fee structure"}
      />

      <Card className="w-full">
        <CardContent className="pt-6">
          <FeeStructureForm
            academicYears={academicYearOptions}
            autoSaveKey={buildAutoSaveKey(mode, feeStructureId)}
            campusLabel={
              mode === "edit"
                ? (feeStructureQuery.data?.campusName ?? activeCampusLabel)
                : activeCampusLabel
            }
            canUseCampusScope={Boolean(activeCampusLabel)}
            defaultValues={defaultValues}
            errorMessage={errorMessage}
            isPending={isPending}
            isReadOnly={Boolean(feeStructureQuery.data?.isInstallmentLocked)}
            lockScope={mode === "edit"}
            lockReason={
              mode === "edit"
                ? (feeStructureQuery.data?.lockReason ?? undefined)
                : undefined
            }
            onAutoSaveReady={handleAutoSaveReady}
            onCancel={() => {
              void navigate(
                appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search),
              );
            }}
            onDirtyChange={setIsDirty}
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

      <UnsavedChangesDialog blocker={blocker} />
    </EntityPageShell>
  );
}

function FeeStructureBreadcrumbs({
  label,
  location,
}: {
  label: string;
  location: ReturnType<typeof useLocation>;
}) {
  return (
    <Breadcrumbs
      items={[
        {
          label: "Fee Structures",
          href: appendSearch(ERP_ROUTES.FEE_STRUCTURES, location.search),
        },
        { label },
      ]}
    />
  );
}
