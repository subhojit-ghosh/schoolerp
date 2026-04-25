import { STUDENT_ROLLOVER_PREVIEW_STATUS } from "@repo/contracts";
import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

const rolloverSectionMappingSchema = z.object({
  sourceClassId: z.string().trim(),
  sourceSectionId: z.string().trim(),
  targetClassId: z.string().trim(),
  targetSectionId: z.string().trim(),
});

export const studentRolloverFormSchema = z
  .object({
    sourceAcademicYearId: z.uuid("Select a source academic year"),
    targetAcademicYearId: z.uuid("Select a target academic year"),
    sectionMappings: z.array(rolloverSectionMappingSchema),
    failedStudentIds: z.array(z.uuid()),
    withdrawnStudentIds: z.array(z.uuid()),
  })
  .refine(
    (value) => value.sourceAcademicYearId !== value.targetAcademicYearId,
    {
      path: ["targetAcademicYearId"],
      message: "Select a different target academic year",
    },
  );

export type StudentRolloverFormValues = z.infer<
  typeof studentRolloverFormSchema
>;
export type StudentRolloverPreview =
  components["schemas"]["StudentRolloverPreviewDto"];
export type StudentRolloverExecute =
  components["schemas"]["StudentRolloverExecuteDto"];

export const STUDENT_ROLLOVER_STATUS_STYLES = {
  [STUDENT_ROLLOVER_PREVIEW_STATUS.MAPPED]:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  [STUDENT_ROLLOVER_PREVIEW_STATUS.FAILED]:
    "border-orange-200 bg-orange-50 text-orange-700",
  [STUDENT_ROLLOVER_PREVIEW_STATUS.UNMAPPED]:
    "border-amber-200 bg-amber-50 text-amber-700",
  [STUDENT_ROLLOVER_PREVIEW_STATUS.WITHDRAWN]:
    "border-slate-200 bg-slate-100 text-slate-700",
} as const;

export function toStudentRolloverBody(values: StudentRolloverFormValues) {
  return {
    sourceAcademicYearId: values.sourceAcademicYearId,
    targetAcademicYearId: values.targetAcademicYearId,
    sectionMappings: values.sectionMappings
      .filter((mapping) => mapping.targetClassId && mapping.targetSectionId)
      .map((mapping) => ({
        sourceClassId: mapping.sourceClassId,
        sourceSectionId: mapping.sourceSectionId,
        targetClassId: mapping.targetClassId,
        targetSectionId: mapping.targetSectionId,
      })),
    failedStudentIds: values.failedStudentIds,
    withdrawnStudentIds: values.withdrawnStudentIds,
  };
}

export function getStudentRolloverPreviewSignature(
  values: StudentRolloverFormValues,
) {
  return JSON.stringify(toStudentRolloverBody(values));
}
