import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { extractApiError } from "@/lib/api-error";
import { RouteEntitySheet } from "@/components/entities/route-entity-sheet";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import {
  useCreateCategoryMutation,
  useCategoriesQuery,
  useUpdateCategoryMutation,
} from "@/features/inventory/api/use-inventory";
import {
  CATEGORY_DEFAULT_VALUES,
  type CategoryFormValues,
} from "@/features/inventory/model/category-form-schema";
import { CategoryForm } from "@/features/inventory/ui/category-form";
import { appendSearch } from "@/lib/routes";

type InventoryCategorySheetRouteProps = {
  mode: "create" | "edit";
};

export function InventoryCategorySheetRoute({ mode }: InventoryCategorySheetRouteProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryId } = useParams();
  const session = useAuthStore((store) => store.session);
  const isEnabled = Boolean(session?.activeOrganization?.id);

  const categoriesQuery = useCategoriesQuery(mode === "edit" && isEnabled);
  const createMutation = useCreateCategoryMutation();
  const updateMutation = useUpdateCategoryMutation();

  const closeTo = useMemo(
    () => appendSearch(ERP_ROUTES.INVENTORY_CATEGORIES, location.search),
    [location.search],
  );

  const rows = (categoriesQuery.data as { rows?: unknown[] } | undefined)?.rows ?? categoriesQuery.data;
  const editingCategory = Array.isArray(rows)
    ? (rows as Array<Record<string, unknown>>).find((c) => c.id === categoryId)
    : undefined;

  const defaultValues = useMemo<CategoryFormValues>(() => {
    if (mode === "create" || !editingCategory) {
      return CATEGORY_DEFAULT_VALUES;
    }
    return {
      name: editingCategory.name as string,
      description: (editingCategory.description as string) ?? "",
    };
  }, [editingCategory, mode]);

  const isPending = createMutation.isPending || updateMutation.isPending;
  const errorMessage =
    (createMutation.error as Error | null | undefined)?.message ??
    (updateMutation.error as Error | null | undefined)?.message ??
    undefined;

  async function handleSubmit(values: CategoryFormValues) {
    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          body: {
            name: values.name,
            description: values.description || undefined,
          },
        });
        toast.success("Category created.");
        void navigate(closeTo);
      } else if (categoryId) {
        await updateMutation.mutateAsync({
          params: { path: { categoryId } },
          body: {
            name: values.name,
            description: values.description || null,
          },
        });
        toast.success("Category updated.");
        void navigate(closeTo);
      }
    } catch (error) {
      toast.error(extractApiError(error, "Could not save category. Please try again."));
    }
  }

  const title = mode === "create" ? "New category" : "Edit category";
  const description =
    mode === "create"
      ? "Add a new inventory category."
      : (editingCategory?.name as string) ?? "Edit this category.";

  return (
    <RouteEntitySheet closeTo={closeTo} description={description} title={title}>
      <CategoryForm
        defaultValues={defaultValues}
        errorMessage={errorMessage}
        isPending={isPending}
        submitLabel={mode === "create" ? "Create category" : "Save changes"}
        onCancel={() => void navigate(closeTo)}
        onSubmit={handleSubmit}
      />
    </RouteEntitySheet>
  );
}
