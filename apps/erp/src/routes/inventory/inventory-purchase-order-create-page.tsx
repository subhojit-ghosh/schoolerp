import { useMemo } from "react";
import { useNavigate } from "react-router";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@repo/ui/components/ui/field";
import {
  EntityFormPrimaryAction,
  EntityFormSecondaryAction,
} from "@/components/entities/entity-actions";
import { Breadcrumbs } from "@/components/navigation/breadcrumbs";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreatePurchaseOrderMutation,
  useVendorsQuery,
  useItemsQuery,
} from "@/features/inventory/api/use-inventory";
import { useDocumentTitle } from "@/hooks/use-document-title";

const MIN_ITEMS = 1;
const ORDER_NUMBER_MIN = 1;

const purchaseOrderFormSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  orderNumber: z.string().trim().min(ORDER_NUMBER_MIN, "Order number is required"),
  orderDate: z.string().min(1, "Order date is required"),
  expectedDeliveryDate: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        itemId: z.string().min(1, "Item is required"),
        quantityOrdered: z.number().min(1, "Quantity must be at least 1"),
        unitPriceInPaise: z.number().min(0, "Price must be non-negative"),
      }),
    )
    .min(MIN_ITEMS, "At least one item is required"),
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

const DEFAULT_VALUES: PurchaseOrderFormValues = {
  vendorId: "",
  orderNumber: "",
  orderDate: new Date().toISOString().slice(0, 10),
  expectedDeliveryDate: "",
  notes: "",
  items: [{ itemId: "", quantityOrdered: 1, unitPriceInPaise: 0 }],
};

export function InventoryPurchaseOrderCreatePage() {
  useDocumentTitle("New Purchase Order");
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const vendorsQuery = useVendorsQuery(isEnabled, {
    limit: 200,
    status: "active",
  });
  const itemsQuery = useItemsQuery(isEnabled, {
    limit: 500,
    status: "active",
  });
  const createMutation = useCreatePurchaseOrderMutation();

  const vendorOptions = useMemo(
    () =>
      ((vendorsQuery.data?.rows ?? []) as Array<{ id: string; name: string }>),
    [vendorsQuery.data?.rows],
  );

  const itemOptions = useMemo(
    () =>
      ((itemsQuery.data?.rows ?? []) as Array<{ id: string; name: string }>),
    [itemsQuery.data?.rows],
  );

  const { control, handleSubmit } = useForm<PurchaseOrderFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Zod v4 + react-hook-form + TS 6 type bridge
    resolver: zodResolver(purchaseOrderFormSchema) as any,
    mode: "onTouched",
    defaultValues: DEFAULT_VALUES,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  async function onSubmit(values: PurchaseOrderFormValues) {
    try {
      await createMutation.mutateAsync({
        body: {
          vendorId: values.vendorId,
          orderNumber: values.orderNumber,
          orderDate: values.orderDate,
          expectedDeliveryDate: values.expectedDeliveryDate || undefined,
          notes: values.notes || undefined,
          items: values.items.map((item) => ({
            itemId: item.itemId,
            quantityOrdered: item.quantityOrdered,
            unitPriceInPaise: item.unitPriceInPaise,
          })),
        },
      });
      toast.success("Purchase order created.");
      void navigate(ERP_ROUTES.INVENTORY_PURCHASE_ORDERS);
    } catch (error) {
      toast.error(
        extractApiError(
          error,
          "Could not create purchase order. Please try again.",
        ),
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Breadcrumbs
          items={[
            {
              label: "Purchase Orders",
              href: ERP_ROUTES.INVENTORY_PURCHASE_ORDERS,
            },
            { label: "New Purchase Order" },
          ]}
        />
        <h1 className="text-2xl font-bold tracking-tight">
          New Purchase Order
        </h1>
        <p className="text-sm text-muted-foreground">
          Create a purchase order for inventory items.
        </p>
      </div>

      <form
        className="max-w-3xl space-y-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <div className="rounded-lg border bg-card p-6">
          <FieldGroup className="gap-4">
            <Controller
              control={control}
              name="vendorId"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel required>Vendor</FieldLabel>
                  <FieldContent>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger aria-invalid={fieldState.invalid}>
                        <SelectValue placeholder="Select a vendor" />
                      </SelectTrigger>
                      <SelectContent>
                        {vendorOptions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.name}
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
              name="orderNumber"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid || undefined}>
                  <FieldLabel required>Order Number</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      placeholder="e.g. PO-2026-001"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="orderDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Order Date</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        type="date"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="expectedDeliveryDate"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel>Expected Delivery</FieldLabel>
                    <FieldContent>
                      <Input
                        {...field}
                        type="date"
                        aria-invalid={fieldState.invalid}
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
                      placeholder="Optional notes for this order"
                    />
                    <FieldError>{fieldState.error?.message}</FieldError>
                  </FieldContent>
                </Field>
              )}
            />
          </FieldGroup>
        </div>

        <div className="rounded-lg border bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Order Items</h2>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                append({
                  itemId: "",
                  quantityOrdered: 1,
                  unitPriceInPaise: 0,
                })
              }
            >
              <IconPlus className="mr-1 size-4" />
              Add item
            </Button>
          </div>

          {fields.map((arrayField, index) => (
            <div
              key={arrayField.id}
              className="grid gap-3 sm:grid-cols-[1fr_100px_120px_auto] items-end rounded-md border p-3"
            >
              <Controller
                control={control}
                name={`items.${index}.itemId`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Item</FieldLabel>
                    <FieldContent>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select item" />
                        </SelectTrigger>
                        <SelectContent>
                          {itemOptions.map((it) => (
                            <SelectItem key={it.id} value={it.id}>
                              {it.name}
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
                name={`items.${index}.quantityOrdered`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Qty</FieldLabel>
                    <FieldContent>
                      <Input
                        aria-invalid={fieldState.invalid}
                        type="number"
                        min={1}
                        value={field.value}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? 1
                              : parseInt(e.target.value, 10),
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
                name={`items.${index}.unitPriceInPaise`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid || undefined}>
                    <FieldLabel required>Price (paise)</FieldLabel>
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
                      <FieldError>{fieldState.error?.message}</FieldError>
                    </FieldContent>
                  </Field>
                )}
              />

              <div className="flex items-end pb-1">
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="size-8 text-destructive"
                  onClick={() => fields.length > 1 && remove(index)}
                  disabled={fields.length <= 1}
                >
                  <IconTrash className="size-4" />
                  <span className="sr-only">Remove</span>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <EntityFormPrimaryAction
            disabled={createMutation.isPending}
            type="submit"
          >
            {createMutation.isPending
              ? "Creating..."
              : "Create purchase order"}
          </EntityFormPrimaryAction>
          <EntityFormSecondaryAction
            disabled={createMutation.isPending}
            onClick={() =>
              void navigate(ERP_ROUTES.INVENTORY_PURCHASE_ORDERS)
            }
            type="button"
          >
            Cancel
          </EntityFormSecondaryAction>
        </div>
      </form>
    </div>
  );
}
