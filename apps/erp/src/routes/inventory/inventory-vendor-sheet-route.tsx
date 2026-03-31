import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateVendorMutation,
  useVendorsQuery,
  useUpdateVendorMutation,
} from "@/features/inventory/api/use-inventory";
import {
  VENDOR_DEFAULT_VALUES,
  type VendorFormValues,
} from "@/features/inventory/model/vendor-form-schema";
import { VendorForm } from "@/features/inventory/ui/vendor-form";
import { appendSearch } from "@/lib/routes";

type InventoryVendorSheetRouteProps = {
  mode: "create" | "edit";
};

export function InventoryVendorSheetRoute({
  mode,
}: InventoryVendorSheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { vendorId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const vendorsQuery = useVendorsQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateVendorMutation();
  const updateMutation = useUpdateVendorMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.INVENTORY_VENDORS, location.search),
    [location.search],
  );

  const rows =
    (vendorsQuery.data as { rows?: unknown[] } | undefined)?.rows ??
    vendorsQuery.data;
  const editingVendor = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((v) => v.id === vendorId)
    : undefined;

  const defaultValues = useMemo<VendorFormValues>(() => {
    if (mode === "create" || !editingVendor) {
      return VENDOR_DEFAULT_VALUES;
    }
    return {
      name: editingVendor.name as string,
      contactPerson: (editingVendor.contactPerson as string) ?? "",
      phone: (editingVendor.phone as string) ?? "",
      email: (editingVendor.email as string) ?? "",
      address: (editingVendor.address as string) ?? "",
      gstNumber: (editingVendor.gstNumber as string) ?? "",
    };
  }, [editingVendor, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: VendorFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            contactPerson: values.contactPerson || undefined,
            phone: values.phone || undefined,
            email: values.email || undefined,
            address: values.address || undefined,
            gstNumber: values.gstNumber || undefined,
          },
        });
        toast.success("Vendor created.");
        void navigate(closeTo);
      } else if (vendorId) {
        await updateMutation.mutateAsync({
          params: { path: { vendorId } },
          body: {
            name: values.name,
            contactPerson: values.contactPerson || null,
            phone: values.phone || null,
            email: values.email || null,
            address: values.address || null,
            gstNumber: values.gstNumber || null,
          },
        });
        toast.success("Vendor updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(
        extractApiError(error, "Could not save vendor. Please try again."),
      );
    }
  }

  const title = mode === "create" ? "New vendor" : "Edit vendor";
  const description =
    mode === "create"
      ? "Add a new vendor for procurement."
      : ((editingVendor?.name as string) ?? "Edit this vendor.");

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <VendorForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create vendor" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
