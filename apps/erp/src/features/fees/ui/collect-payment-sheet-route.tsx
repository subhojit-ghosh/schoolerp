import { useMemo } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import { buildFeeAssignmentReceiptRoute, ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { DOCUMENT_QUERY_PARAMS } from "@/features/documents/model/document.constants";
import {
  useFeeAssignmentQuery,
  useCreateFeePaymentMutation,
  useReverseFeePaymentMutation,
  useSendFeeReminderMutation,
} from "@/features/fees/api/use-fees";
import {
  FEE_PAYMENT_METHOD_OPTIONS,
  createFeePaymentFormSchema,
  type FeePaymentFormValues,
} from "@/features/fees/model/fee-form-schema";
import {
  formatFeeDate,
  formatFeeStatusLabel,
  formatRupees,
} from "@/features/fees/model/fee-formatters";
import { extractApiError } from "@/lib/api-error";
import { appendSearch } from "@/lib/routes";
import { ERP_TOAST_MESSAGES, ERP_TOAST_SUBJECTS } from "@/lib/toast-messages";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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

function toMethodLabel(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusVariant(
  status: string,
): "default" | "secondary" | "destructive" {
  if (status === "paid") return "default";
  return "secondary";
}

type CollectPaymentFormProps = {
  assignmentId: string;
  outstandingAmountInPaise: number;
  errorMessage?: string;
  isPending?: boolean;
  onCancel: () => void;
  onSubmit: (values: FeePaymentFormValues) => Promise<void> | void;
};

function CollectPaymentForm({
  assignmentId,
  outstandingAmountInPaise,
  errorMessage,
  isPending = false,
  onCancel,
  onSubmit,
}: CollectPaymentFormProps) {
  const today = new Date().toISOString().split("T")[0];

  const { control, handleSubmit } = useForm<FeePaymentFormValues>({
    resolver: zodResolver(createFeePaymentFormSchema(outstandingAmountInPaise)),
    mode: "onTouched",
    defaultValues: {
      feeAssignmentId: assignmentId,
      amount: String(outstandingAmountInPaise / 100),
      paymentDate: today,
      paymentMethod: FEE_PAYMENT_METHOD_OPTIONS[0],
      referenceNumber: "",
      notes: "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Controller
            control={control}
            name="amount"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Payment amount (₹)</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    inputMode="decimal"
                    min="0"
                    max={(outstandingAmountInPaise / 100).toFixed(2)}
                    step="0.01"
                    type="number"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="paymentDate"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Payment date</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    type="date"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />

          <Controller
            control={control}
            name="paymentMethod"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel required>Payment method</FieldLabel>
                <FieldContent>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {FEE_PAYMENT_METHOD_OPTIONS.map((method) => (
                          <SelectItem key={method} value={method}>
                            {toMethodLabel(method)}
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
            name="referenceNumber"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid || undefined}>
                <FieldLabel>Reference</FieldLabel>
                <FieldContent>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    placeholder="Optional payment reference"
                  />
                  <FieldError>{fieldState.error?.message}</FieldError>
                </FieldContent>
              </Field>
            )}
          />
        </div>

        <Controller
          control={control}
          name="notes"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Notes</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="Optional payment note"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Recording..." : "Record payment"}
          </EntityFormPrimaryAction>
          <EntityFormSecondaryAction
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </EntityFormSecondaryAction>
        </div>
      </FieldGroup>
    </form>
  );
}

export function CollectPaymentSheetRoute() {
  const location = useLocation();
  const navigate = useNavigate();
  const { feeAssignmentId } = useParams();
  const session = useAuthStore((store) => store.session);
  const institutionId = session?.activeOrganization?.id;

  const assignmentQuery = useFeeAssignmentQuery(
    Boolean(institutionId),
    feeAssignmentId,
  );
  const paymentMutation = useCreateFeePaymentMutation();
  const reversePaymentMutation = useReverseFeePaymentMutation();
  const reminderMutation = useSendFeeReminderMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.FEE_ASSIGNMENTS, location.search),
    [location.search],
  );

  const buildReceiptHref = useMemo(
    () => (paymentId?: string) => {
      if (!feeAssignmentId) {
        return ERP_ROUTES.FEE_ASSIGNMENTS;
      }

      if (!paymentId) {
        return buildFeeAssignmentReceiptRoute(feeAssignmentId);
      }

      const params = new URLSearchParams({
        [DOCUMENT_QUERY_PARAMS.PAYMENT_ID]: paymentId,
      });

      return `${buildFeeAssignmentReceiptRoute(feeAssignmentId)}?${params.toString()}`;
    },
    [feeAssignmentId],
  );

  async function handleSubmit(values: FeePaymentFormValues) {
    try {
      const createdPayment = await paymentMutation.mutateAsync({
        body: {
          feeAssignmentId: values.feeAssignmentId,
          amount: Number(values.amount),
          paymentDate: values.paymentDate,
          paymentMethod: values.paymentMethod,
          referenceNumber: values.referenceNumber || null,
          notes: values.notes || null,
        },
      });
      toast.success(ERP_TOAST_MESSAGES.created(ERP_TOAST_SUBJECTS.FEE_PAYMENT));
      void navigate(buildReceiptHref(createdPayment.id));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not record payment. Please try again."),
      );
    }
  }

  async function handleReversePayment(feePaymentId: string) {
    try {
      await reversePaymentMutation.mutateAsync({
        params: { path: { feePaymentId } },
        body: {},
      });
      toast.success(ERP_TOAST_MESSAGES.updated(ERP_TOAST_SUBJECTS.FEE_PAYMENT));
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not reverse payment. Please try again."),
      );
    }
  }

  async function handleSendReminder() {
    if (!feeAssignmentId) return;
    try {
      await reminderMutation.mutateAsync({
        params: { path: { feeAssignmentId } },
      });
      toast.success("Reminder sent to guardian.");
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not send reminder. Please try again."),
      );
    }
  }

  if (assignmentQuery.isLoading) {
    return (
      <RouteEntitySheet
        closeTo={closeTo}
        description="Loading assignment details..."
        title="Collect payment"
      >
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Loading...
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  if (!assignmentQuery.data) {
    return (
      <RouteEntitySheet
        closeTo={closeTo}
        description="The requested assignment could not be loaded."
        title="Assignment not found"
      >
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Return to fee assignments and try again.
          </CardContent>
        </Card>
      </RouteEntitySheet>
    );
  }

  const assignment = assignmentQuery.data;
  const errorMessage =
    (paymentMutation.error as Error | null | undefined)?.message ?? undefined;

  return (
    <RouteEntitySheet
      closeTo={closeTo}
      description={`${assignment.studentFullName} · ${assignment.feeStructureName}`}
      title="Collect payment"
    >
      <div className="space-y-4">
        <Card>
          <CardContent className="py-4">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Student</dt>
                <dd className="font-medium">{assignment.studentFullName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Admission No.</dt>
                <dd className="font-mono font-medium">
                  {assignment.studentAdmissionNumber}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Fee structure</dt>
                <dd className="font-medium">{assignment.feeStructureName}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  <Badge variant={statusVariant(assignment.status)}>
                    {formatFeeStatusLabel(assignment.status)}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Assigned</dt>
                <dd className="font-medium">
                  {formatRupees(assignment.assignedAmountInPaise)}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Paid</dt>
                <dd className="font-medium">
                  {formatRupees(assignment.paidAmountInPaise)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Outstanding</dt>
                <dd className="text-base font-semibold text-foreground">
                  {formatRupees(assignment.outstandingAmountInPaise)}
                </dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted-foreground">Concessions applied</dt>
                <dd className="font-medium">
                  {formatRupees(assignment.adjustedAmountInPaise)}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {assignment.status === "paid" ? (
          <Card>
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              This assignment has been fully paid. No further payments needed.
            </CardContent>
          </Card>
        ) : (
          <>
            <CollectPaymentForm
              assignmentId={assignment.id}
              outstandingAmountInPaise={assignment.outstandingAmountInPaise}
              errorMessage={errorMessage}
              isPending={paymentMutation.isPending}
              onCancel={() => void navigate(closeTo)}
              onSubmit={handleSubmit}
            />
            <Card>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-sm">
                    <p className="font-medium">Send payment reminder</p>
                    <p className="text-muted-foreground">
                      Notify the guardian via SMS and email about this
                      outstanding fee.
                    </p>
                  </div>
                  <EntityFormSecondaryAction
                    className="shrink-0"
                    disabled={reminderMutation.isPending}
                    onClick={() => void handleSendReminder()}
                    type="button"
                  >
                    {reminderMutation.isPending
                      ? "Sending..."
                      : "Send reminder"}
                  </EntityFormSecondaryAction>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recorded payments</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignment.payments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No payments recorded yet.
              </p>
            ) : (
              assignment.payments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-3"
                >
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">
                      {formatRupees(payment.amountInPaise)} via{" "}
                      {toMethodLabel(payment.paymentMethod)}
                    </p>
                    <p className="text-muted-foreground">
                      {formatFeeDate(payment.paymentDate)}
                      {payment.referenceNumber
                        ? ` · Ref ${payment.referenceNumber}`
                        : ""}
                    </p>
                    {payment.reversedAt ? (
                      <p className="text-destructive">
                        Reversed on{" "}
                        {formatFeeDate(payment.reversedAt.slice(0, 10))}
                      </p>
                    ) : null}
                  </div>
                  {!payment.reversedAt ? (
                    <div className="flex items-center gap-2">
                      <EntityFormSecondaryAction asChild className="h-8">
                        <Link target="_blank" to={buildReceiptHref(payment.id)}>
                          Receipt
                        </Link>
                      </EntityFormSecondaryAction>
                      <EntityFormSecondaryAction
                        className="h-8"
                        disabled={reversePaymentMutation.isPending}
                        onClick={() => void handleReversePayment(payment.id)}
                        type="button"
                      >
                        Reverse
                      </EntityFormSecondaryAction>
                    </div>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Concessions and waivers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {assignment.adjustments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No concessions applied yet.
              </p>
            ) : (
              assignment.adjustments.map((adjustment) => (
                <div
                  key={adjustment.id}
                  className="rounded-lg border p-3 text-sm"
                >
                  <p className="font-medium">
                    {formatRupees(adjustment.amountInPaise)} ·{" "}
                    {formatFeeStatusLabel(adjustment.adjustmentType)}
                  </p>
                  <p className="text-muted-foreground">
                    {formatFeeDate(adjustment.createdAt.slice(0, 10))}
                  </p>
                  {adjustment.reason ? <p>{adjustment.reason}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </RouteEntitySheet>
  );
}
