import { z } from "zod";

const CLASS_NAME_MIN_LENGTH = 1;
const SECTION_NAME_MIN_LENGTH = 1;

const classSectionFormSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().trim().min(SECTION_NAME_MIN_LENGTH, "Section name is required"),
});

function hasUniqueSectionNames(
  sections: Array<z.infer<typeof classSectionFormSchema>>,
) {
  const names = sections.map((section) => section.name.trim().toLowerCase());
  return new Set(names).size === names.length;
}

export const classFormSchema = z
  .object({
    name: z.string().trim().min(CLASS_NAME_MIN_LENGTH, "Class name is required"),
    code: z.string().trim().optional(),
    campusId: z.uuid("Select a campus"),
    sections: z.array(classSectionFormSchema).min(1, "Add at least one section"),
  })
  .refine((value) => hasUniqueSectionNames(value.sections), {
    path: ["sections"],
    message: "Section names must be unique.",
  });

export type ClassFormValues = z.infer<typeof classFormSchema>;
