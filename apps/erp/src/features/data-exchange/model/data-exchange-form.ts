import { dataExchangeEntityTypeSchema } from "@repo/contracts";
import { z } from "zod";

export const dataExchangeImportFormSchema = z.object({
  entityType: dataExchangeEntityTypeSchema,
  file: z
    .instanceof(File, { message: "Select a CSV file." })
    .refine((file) => file.name.toLowerCase().endsWith(".csv"), {
      message: "Upload a CSV file.",
    }),
});

export type DataExchangeImportFormValues = z.infer<
  typeof dataExchangeImportFormSchema
>;
