import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ERROR_MESSAGES } from "../../constants";

const CLASS_NAME_MIN_LENGTH = 1;
const SECTION_NAME_MIN_LENGTH = 1;

const sectionSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(SECTION_NAME_MIN_LENGTH, "Section name is required"),
});

function hasUniqueSectionNames(
  sections: Array<z.infer<typeof sectionSchema>>,
) {
  const names = sections.map((section) => section.name.trim().toLowerCase());
  return new Set(names).size === names.length;
}

export const createClassSchema = z
  .object({
    name: z.string().trim().min(CLASS_NAME_MIN_LENGTH, "Class name is required"),
    code: z
      .string()
      .trim()
      .optional()
      .or(z.literal(""))
      .transform((value) => value || undefined),
    campusId: z.uuid(),
    sections: z.array(sectionSchema).min(1, "Add at least one section"),
  })
  .refine((value) => hasUniqueSectionNames(value.sections), {
    path: ["sections"],
    message: ERROR_MESSAGES.CLASSES.SECTION_NAME_EXISTS,
  });

export const updateClassSchema = createClassSchema;

export const classIdSchema = z.object({
  classId: z.uuid(),
});

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = z.infer<typeof updateClassSchema>;

function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new BadRequestException(result.error.flatten());
  }

  return result.data;
}

export function parseCreateClass(body: unknown): CreateClassDto {
  return parseSchema(createClassSchema, body);
}

export function parseUpdateClass(body: unknown): UpdateClassDto {
  return parseSchema(updateClassSchema, body);
}
