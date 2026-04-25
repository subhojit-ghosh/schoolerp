import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const rolloverSectionMappingSchema = z.object({
  sourceClassId: z.uuid(),
  sourceSectionId: z.uuid(),
  targetClassId: z.uuid(),
  targetSectionId: z.uuid(),
});

const studentRolloverRequestSchema = z
  .object({
    sourceAcademicYearId: z.uuid("Select a source academic year"),
    targetAcademicYearId: z.uuid("Select a target academic year"),
    sectionMappings: z.array(rolloverSectionMappingSchema).default([]),
    failedStudentIds: z.array(z.uuid()).default([]),
    withdrawnStudentIds: z.array(z.uuid()).default([]),
  })
  .refine(
    (value) => value.sourceAcademicYearId !== value.targetAcademicYearId,
    {
      path: ["targetAcademicYearId"],
      message: ERROR_MESSAGES.STUDENTS.ROLLOVER_DIFFERENT_YEAR_REQUIRED,
    },
  );

export type StudentRolloverSectionMappingDto = z.infer<
  typeof rolloverSectionMappingSchema
>;
export type StudentRolloverRequestDto = z.infer<
  typeof studentRolloverRequestSchema
>;

export function parseStudentRolloverRequest(input: unknown) {
  const parsedResult = studentRolloverRequestSchema.safeParse(input);

  if (!parsedResult.success) {
    const firstIssue = parsedResult.error.issues[0];
    throw new BadRequestException(
      firstIssue?.message ?? "Invalid student rollover request.",
    );
  }

  return parsedResult.data;
}
