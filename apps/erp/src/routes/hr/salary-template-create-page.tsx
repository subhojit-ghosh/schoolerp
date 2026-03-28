import { useCallback, useMemo, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { DraftRecoveryBanner } from "@/components/feedback/draft-recovery-banner";
import { UnsavedChangesDialog } from "@/components/feedback/unsaved-changes-dialog";
import { useFormAutoSave } from "@/hooks/use-form-auto-save";
import { useUnsavedChangesGuard } from "@/hooks/use-unsaved-changes-guard";
import { extractApiError } from "@/lib/api-error";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { useDocumentTitle } from "@/hooks/use-document-title";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  EntityPageHeader,
  EntityPageShell,
} from "@/components/entities/entity-page-shell";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { PERMISSIONS } from "@repo/contracts";
import { ERP_ROUTES } from "@/constants/routes";
import { hasPermission } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateSalaryTemplateMutation,
  useSalaryComponentsQuery,
} from "@/features/payroll/api/use-payroll";
import {
  SALARY_TEMPLATE_DEFAULT_VALUES,
  salaryTemplateFormSchema,
  type SalaryTemplateFormValues,
} from "@/features/payroll/model/salary-template-form-schema";
// formatPaiseToRupees will be used when template summary is added

type ComponentOption = {
  id: string;
  name: string;
  type: "earning" | "deduction";
  calculationType: "fixed" | "percentage";
};

export function SalaryTemplateCreatePage() {
  useDocumentTitle("New Salary Template");
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const canReadPayroll = hasPermission(session, PERMISSIONS.PAYROLL_READ);

  const componentsQuery = useSalaryComponentsQuery(canReadPayroll, {
    limit: 200,
    sort: "sortOrder",
    order: "asc",
  });
  const createMutation = useCreateSalaryTemplateMutation();

  const componentOptions = useMemo(() => {
    const rows = (componentsQuery.data as { rows?: unknown[] } | undefined)?.rows ?? componentsQuery.data;
    if (!Array.isArray(rows)) return [];
    return (rows as Array<Record<string, unknown>>)
      .filter((c) => c.status === "active")
      .map((c) => ({
        id: c.id as string,
        name: c.name as string,
        type: c.type as "earning" | "deduction",
        calculationType: c.calculationType as "fixed" | "percentage",
      }));
  }, [componentsQuery.data]);

  const { control, handleSubmit, reset, watch, formState } =
    useForm<SalaryTemplateFormValues>({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 input/output type divergence with react-hook-form + TS 6
      resolver: zodResolver(salaryTemplateFormSchema) as any,
      mode: "onTouched",
      defaultValues: SALARY_TEMPLATE_DEFAULT_VALUES,
    });

  const autoSave = useFormAutoSave({
    key: "salary-template-create",
    watch,
    reset,
    isDirty: formState.isDirty,
  });
  const clearDraftRef = useRef(autoSave.clearDraft);
  clearDraftRef.current = autoSave.clearDraft;

  const blocker = useUnsavedChangesGuard(formState.isDirty);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "components",
  });

  const isPending = createMutation.isPending;
  const errorMessage = (createMutation.error as Error | null | undefined)
    ?.message;

  const getComponentById = useCallback(
    (id: string): ComponentOption | undefined =>
      componentOptions.find((c) => c.id === id),
    [componentOptions],
  );

  async function onSubmit(values: SalaryTemplateFormValues) {
    try {
      await createMutation.mutateAsync({
        body: {
          name: values.name,
          description: values.description || undefined,
          components: values.components.map((c) => ({
            salaryComponentId: c.salaryComponentId,
            amountInPaise: c.amountInPaise ?? undefined,
            percentage: c.percentage ?? undefined,
            sortOrder: c.sortOrder,
          })),
        },
      });
      clearDraftRef.current();
      toast.success("Salary template created.");
      void navigate(ERP_ROUTES.PAYROLL_SALARY_TEMPLATES);
    } catch (error) {
      toast.error(extractApiError(error, "Could not create salary template. Please try again."));
    }
  }

  return (
    <EntityPageShell width="form">
      <EntityPageHeader
        backAction={
          <Breadcrumbs
            items={[
              { label: "Salary Templates", href: ERP_ROUTES.PAYROLL_SALARY_TEMPLATES },
              { label: "New Salary Template" },
            ]}
          />
        }
        title="New Salary Template"
        description="Define a salary structure with earning and deduction components."
      />

      <DraftRecoveryBanner
        hasDraft={autoSave.hasDraft}
        onRestore={autoSave.restoreDraft}
        onDiscard={autoSave.discardDraft}
      />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <FieldGroup className="gap-4">
              <Controller
                control={control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Template Name</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        placeholder="e.g. Standard Teaching Staff, Admin Staff"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Description</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        aria-invalid={fieldState.invalid}
                        placeholder="Optional internal note"
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </FieldGroup>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Components</h2>
                <p className="text-sm text-muted-foreground">
                  Add earning and deduction components to this template.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    salaryComponentId: "",
                    amountInPaise: null,
                    percentage: null,
                    sortOrder: fields.length,
                  })
                }
              >
                <IconPlus className="mr-1 size-4" />
                Add component
              </Button>
            </div>

            {fields.length === 0 ? (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">
                  No components added yet. Add at least one component.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {fields.map((item, index) => (
                  <ComponentRow
                    key={item.id}
                    control={control}
                    index={index}
                    componentOptions={componentOptions}
                    getComponentById={getComponentById}
                    onRemove={() => remove(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {errorMessage ? (
            <p className="text-sm text-destructive">{errorMessage}</p>
          ) : null}
        </div>

        <div className="sticky bottom-0 z-10 border-t bg-background py-4 flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction disabled={isPending} type="submit">
            {isPending ? "Creating..." : "Create salary template"}
          </EntityFormPrimaryAction>
          <EntityFormSecondaryAction
            disabled={isPending}
            onClick={() => void navigate(ERP_ROUTES.PAYROLL_SALARY_TEMPLATES)}
            type="button"
          >
            Cancel
          </EntityFormSecondaryAction>
        </div>
      </form>

      <UnsavedChangesDialog blocker={blocker} />
    </EntityPageShell>
  );
}

function ComponentRow({
  control,
  index,
  componentOptions,
  getComponentById,
  onRemove,
}: {
  control: any;
  index: number;
  componentOptions: ComponentOption[];
  getComponentById: (id: string) => ComponentOption | undefined;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start gap-3 rounded-lg border bg-muted/20 p-4">
      <div className="flex-1 min-w-[200px]">
        <Controller
          control={control}
          name={`components.${index}.salaryComponentId`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Component</FieldLabel>
              <FieldContent>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent>
                    {componentOptions.map((option) => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.name} ({option.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />
      </div>

      <Controller
        control={control}
        name={`components.${index}.salaryComponentId`}
        render={({ field: componentField }) => {
          const selectedComponent = getComponentById(componentField.value);
          const isPercentage = selectedComponent?.calculationType === "percentage";

          return isPercentage ? (
            <div className="w-32">
              <Controller
                control={control}
                name={`components.${index}.percentage`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Percentage</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-invalid={fieldState.invalid}
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value, 10),
                          )
                        }
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </div>
          ) : (
            <div className="w-40">
              <Controller
                control={control}
                name={`components.${index}.amountInPaise`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Amount (paise)</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-invalid={fieldState.invalid}
                        type="number"
                        min={0}
                        value={field.value ?? ""}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? null
                              : parseInt(e.target.value, 10),
                          )
                        }
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />
            </div>
          );
        }}
      />

      <div className="w-20">
        <Controller
          control={control}
          name={`components.${index}.sortOrder`}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Order</FieldLabel>
              <FieldContent>
                <Input
                  aria-invalid={fieldState.invalid}
                  type="number"
                  min={0}
                  value={field.value}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value === ""
                        ? 0
                        : parseInt(e.target.value, 10),
                    )
                  }
                />
              </FieldContent>
            </Field>
          )}
        />
      </div>

      <div className="pt-7">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
        >
          <IconTrash className="size-4" />
        </Button>
      </div>
    </div>
  );
}
