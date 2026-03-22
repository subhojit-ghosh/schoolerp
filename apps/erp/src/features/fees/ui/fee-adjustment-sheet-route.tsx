import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateFeeAdjustmentMutation,
  useFeeAssignmentQuery,
} from "@/features/fees/api/use-fees";
import {
  FEE_ADJUSTMENT_TYPE_OPTIONS,
  feeAdjustmentFormSchema,
  type FeeAdjustmentFormValues,
} from "@/features/fees/model/fee-form-schema";
import { formatRupees } from "@/features/fees/model/fee-formatters";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";

const DEFAULT_VALUES: FeeAdjustmentFormValues = {
  adjustmentType: FEE_ADJUSTMENT_TYPE_OPTIONS[0],
  amount: "",
  reason: "",
};

function toAdjustmentLabel(
  value: (typeof FEE_ADJUSTMENT_TYPE_OPTIONS)[number],
) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function FeeAdjustmentSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { feeAssignmentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const assignmentQuery = useFeeAssignmentQuery(
    Boolean(institutionId),
    feeAssignmentId,
  );
  const adjustmentMutation = useCreateFeeAdjustmentMutation();
  const { control, handleSubmit } = useForm<FeeAdjustmentFormValues>({
    resolver: zodResolver(feeAdjustmentFormSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const outstandingAmountInPaise =
    assignmentQuery.data?.outstandingAmountInPaise ?? 0;
  const canApplyAdjustment = outstandingAmountInPaise > 0;

  async function onSubmit(values: FeeAdjustmentFormValues) {
    if (!feeAssignmentId) {
      return;
    }

    await adjustmentMutation.mutateAsync({
      params: { path: { feeAssignmentId } },
      body: {
        feeAssignmentId,
        adjustmentType: values.adjustmentType,
        amount: Number(values.amount),
        reason: values.reason || null,
      },
    });

    toast.success(
      ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_ASSIGNMENT),
    );
    void navigate(appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search));
  }

  return (
    <RouteEntitySheet
      closeTo={ERP_ROUTES.FEE_ASSIGNMENTS}
      description="Apply a concession, waiver, or discount to reduce the outstanding balance."
      title="Apply concession"
    >
      <div className="space-y-4">
        {assignmentQuery.data ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {assignmentQuery.data.studentFullName}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              Outstanding: {formatRupees(outstandingAmountInPaise)}
            </CardContent>
          </Card>
        ) : null}

        {assignmentQuery.data && !canApplyAdjustment ? (
          <Card>
            <CardContent className="pt-6 text-sm text-muted-foreground">
              This assignment does not have any outstanding balance left to
              waive or discount.
            </CardContent>
          </Card>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="gap-4">
              <Controller
                control={control}
                name="adjustmentType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Type</FieldLabel>
                    <FieldContent>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <SelectTrigger
                          aria-invalid={fieldState.invalid}
                          className="w-full"
                        >
                          <SelectValue placeholder="Select adjustment type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {FEE_ADJUSTMENT_TYPE_OPTIONS.map((type) => (
                              <SelectItem key={type} value={type}>
                                {toAdjustmentLabel(type)}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="amount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Amount (₹)</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        inputMode="decimal"
                        min="0"
                        type="number"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="reason"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Reason</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="Optional reason for the concession"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <div className="flex items-center gap-3">
                <EntityFormPrimaryAction
                  disabled={adjustmentMutation.isPending}
                  type="submit"
                >
                  {adjustmentMutation.isPending
                    ? "Saving..."
                    : "Apply concession"}
                </EntityFormPrimaryAction>
                <EntityFormSecondaryAction
                  disabled={adjustmentMutation.isPending}
                  onClick={() =>
                    void navigate(
                      appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search),
                    )
                  }
                  type="button"
                >
                  Cancel
                </EntityFormSecondaryAction>
              </div>
            </FieldGroup>
          </form>
        )}
      </div>
    </RouteEntitySheet>
  );
}
