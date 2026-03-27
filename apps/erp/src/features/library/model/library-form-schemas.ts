import { z } from "zod";

export const bookFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(500),
  author: z.string().trim().max(300).optional(),
  isbn: z.string().trim().max(50).optional(),
  publisher: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(100).optional(),
  totalCopies: z.number().int().positive(),
});

export type BookFormValues = z.infer<typeof bookFormSchema>;

export const DEFAULT_BOOK_FORM_VALUES: BookFormValues = {
  title: "",
  author: "",
  isbn: "",
  publisher: "",
  genre: "",
  totalCopies: 1,
};

export const issueBookFormSchema = z.object({
  bookId: z.string().min(1, "Book is required"),
  memberId: z.string().min(1, "Member is required"),
  dueDate: z.string().min(1, "Due date is required"),
});

export type IssueBookFormValues = z.infer<typeof issueBookFormSchema>;

export const DEFAULT_ISSUE_BOOK_FORM_VALUES: IssueBookFormValues = {
  bookId: "",
  memberId: "",
  dueDate: "",
};
