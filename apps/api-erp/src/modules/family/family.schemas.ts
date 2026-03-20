import { z } from "zod";

export const familyOverviewQuerySchema = z.object({
  studentId: z.uuid().optional(),
});

export type FamilyOverviewQueryDto = z.infer<
  typeof familyOverviewQuerySchema
>;

export function parseFamilyOverviewQuery(query: unknown) {
  return familyOverviewQuerySchema.parse(query);
}
