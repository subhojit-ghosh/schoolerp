import { z } from "zod";

export const homeworkFormSchema = z.object({
  classId: z.string().min(1, "Class is required"),
  sectionId: z.string().min(1, "Section is required"),
  subjectId: z.string().min(1, "Subject is required"),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  attachmentInstructions: z.string().trim().optional(),
  dueDate: z.string().min(1, "Due date is required"),
});

export type HomeworkFormValues = z.infer<typeof homeworkFormSchema>;

export const DEFAULT_HOMEWORK_FORM_VALUES: HomeworkFormValues = {
  classId: "",
  sectionId: "",
  subjectId: "",
  title: "",
  description: "",
  attachmentInstructions: "",
  dueDate: "",
};
