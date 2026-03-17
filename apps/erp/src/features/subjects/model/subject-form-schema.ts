import { z } from "zod";

const SUBJECT_NAME_MIN_LENGTH = 1;

export const subjectFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(SUBJECT_NAME_MIN_LENGTH, "Subject name is required"),
  code: z.string().trim().max(20).optional(),
});

export type SubjectFormValues = z.infer<typeof subjectFormSchema>;
