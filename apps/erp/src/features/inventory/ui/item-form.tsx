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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import {
  ITEM_DEFAULT_VALUES,
  itemFormSchema,
  type ItemFormValues,
} from "@/features/inventory/model/item-form-schema";
import { INVENTORY_UNIT_LABELS } from "@/features/inventory/model/inventory-constants";

type CategoryOption = {
  id: string;
  name: string;
};

type ItemFormProps = {
  categories: CategoryOption[];
  defaultValues?: ItemFormValues;
  isPending?: boolean;
  errorMessage?: string;
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (values: ItemFormValues) => Promise<void> | void;
};

export function ItemForm({
  categories,
  defaultValues = ITEM_DEFAULT_VALUES,
  isPending = false,
  errorMessage,
  submitLabel = "Create item",
  onCancel,
  onSubmit,
}: ItemFormProps) {
  const { control, handleSubmit } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema) as any,
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FieldGroup className="gap-4">
        <Controller
          control={control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Name</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Whiteboard Marker, Bunsen Burner"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="categoryId"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Category</FieldLabel>
              <FieldContent>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="sku"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>SKU</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="Optional stock-keeping unit code"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="unit"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel required>Unit</FieldLabel>
              <FieldContent>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger aria-invalid={fieldState.invalid}>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(INVENTORY_UNIT_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="minimumStock"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Minimum Stock</FieldLabel>
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
                      e.target.value === "" ? 0 : parseInt(e.target.value, 10),
                    )
                  }
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="location"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Location</FieldLabel>
              <FieldContent>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  placeholder="e.g. Store Room A, Lab Shelf 3"
                />
                <FieldError>{fieldState.error?.message}</FieldError>
              </FieldContent>
            </Field>
          )}
        />

        <Controller
          control={control}
          name="purchasePriceInPaise"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid || undefined}>
              <FieldLabel>Purchase Price (paise)</FieldLabel>
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
                        ? undefined
                        : parseInt(e.target.value, 10),
                    )
                  }
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
            {isPending ? "Saving..." : submitLabel}
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
