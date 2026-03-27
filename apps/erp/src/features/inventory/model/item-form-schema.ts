import { z } from "zod";

export const itemFormSchema = z.object({
  name: z.string().trim().min(1, "Item name is required").max(200),
  categoryId: z.string().min(1, "Select a category"),
  sku: z.string().max(100).optional().or(z.literal("")),
  unit: z.enum(["piece", "box", "pack", "set", "kg", "liter"]).default("piece"),
  minimumStock: z.coerce.number().int().min(0).default(0),
  location: z.string().max(500).optional().or(z.literal("")),
  purchasePriceInPaise: z.coerce.number().int().min(0).optional(),
});

export type ItemFormValues = z.infer<typeof itemFormSchema>;

export const ITEM_DEFAULT_VALUES: ItemFormValues = {
  name: "",
  categoryId: "",
  sku: "",
  unit: "piece",
  minimumStock: 0,
  location: "",
  purchasePriceInPaise: undefined,
};
