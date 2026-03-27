import { z } from "zod";

export const transactionFormSchema = z.object({
  itemId: z.string().min(1, "Select an item"),
  transactionType: z.enum(["purchase", "issue", "return", "adjustment"], {
    message: "Select a transaction type",
  }),
  quantity: z.coerce.number().int().positive("Quantity must be at least 1"),
  referenceNumber: z.string().max(200).optional().or(z.literal("")),
  issuedToMembershipId: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

export const TRANSACTION_DEFAULT_VALUES: TransactionFormValues = {
  itemId: "",
  transactionType: "purchase",
  quantity: 1,
  referenceNumber: "",
  issuedToMembershipId: "",
  notes: "",
};
