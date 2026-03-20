import { z } from "zod";

export const studentPortalOverviewQuerySchema = z.object({
  examTermId: z.uuid().optional(),
});

export type StudentPortalOverviewQueryDto = z.infer<
  typeof studentPortalOverviewQuerySchema
>;

export function parseStudentPortalOverviewQuery(query: unknown) {
  return studentPortalOverviewQuerySchema.parse(query);
}
