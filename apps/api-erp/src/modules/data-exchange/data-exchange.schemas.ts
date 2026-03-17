import {
  dataExchangeEntityTypeSchema,
  type DataExchangeEntityType,
} from "@repo/contracts";
import { z } from "zod";

export const dataExchangeBodySchema = z.object({
  entityType: dataExchangeEntityTypeSchema,
  csvContent: z.string().trim().min(1),
});

export const dataExchangeEntityParamsSchema = z.object({
  entityType: dataExchangeEntityTypeSchema,
});

export type DataExchangeBodyDto = z.infer<typeof dataExchangeBodySchema>;
export type DataExchangeEntityParamsDto = z.infer<
  typeof dataExchangeEntityParamsSchema
>;

export function parseDataExchangeBody(input: unknown) {
  return dataExchangeBodySchema.parse(input);
}

export function parseDataExchangeEntityType(input: unknown): DataExchangeEntityType {
  return dataExchangeEntityParamsSchema.parse(input).entityType;
}
