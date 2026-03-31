import { z } from "zod";

export const createBookSchema = z.object({
  title: z.string().trim().min(1).max(500),
  author: z.string().trim().max(300).optional(),
  isbn: z.string().trim().max(50).optional(),
  publisher: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(100).optional(),
  totalCopies: z.number().int().positive().default(1),
});

export type CreateBookDto = z.infer<typeof createBookSchema>;

export const updateBookSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  author: z.string().trim().max(300).optional(),
  isbn: z.string().trim().max(50).optional(),
  publisher: z.string().trim().max(200).optional(),
  genre: z.string().trim().max(100).optional(),
  totalCopies: z.number().int().positive().optional(),
  status: z.enum(["active", "inactive"]).optional(),
});

export type UpdateBookDto = z.infer<typeof updateBookSchema>;

export const listBooksQuerySchema = z.object({
  q: z.string().trim().optional(),
  campusId: z.string().optional(),
  status: z.enum(["active", "inactive"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["title", "author", "createdAt", "availableCopies"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListBooksQueryDto = z.infer<typeof listBooksQuerySchema>;

export const issueBookSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
  dueDate: z.string().min(1),
});

export type IssueBookDto = z.infer<typeof issueBookSchema>;

export const listTransactionsQuerySchema = z.object({
  q: z.string().trim().optional(),
  campusId: z.string().optional(),
  status: z.enum(["issued", "returned", "overdue"]).optional(),
  memberId: z.string().optional(),
  bookId: z.string().optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["issuedAt", "dueDate", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListTransactionsQueryDto = z.infer<
  typeof listTransactionsQuerySchema
>;

export const returnBookSchema = z.object({
  fineAmount: z.number().int().min(0).optional(),
});

export type ReturnBookDto = z.infer<typeof returnBookSchema>;

export function parseCreateBook(data: unknown): CreateBookDto {
  return createBookSchema.parse(data);
}

export function parseUpdateBook(data: unknown): UpdateBookDto {
  return updateBookSchema.parse(data);
}

export function parseListBooks(data: unknown): ListBooksQueryDto {
  return listBooksQuerySchema.parse(data);
}

export function parseIssueBook(data: unknown): IssueBookDto {
  return issueBookSchema.parse(data);
}

export function parseListTransactions(data: unknown): ListTransactionsQueryDto {
  return listTransactionsQuerySchema.parse(data);
}

export function parseReturnBook(data: unknown): ReturnBookDto {
  return returnBookSchema.parse(data);
}

// ── Fine collection ────────────────────────────────────────────────────────

export const collectFineSchema = z.object({
  waive: z.boolean().default(false),
});

export type CollectFineDto = z.infer<typeof collectFineSchema>;

export function parseCollectFine(data: unknown): CollectFineDto {
  return collectFineSchema.parse(data);
}

// ── Reservations ───────────────────────────────────────────────────────────

export const createReservationSchema = z.object({
  bookId: z.string().min(1),
  memberId: z.string().min(1),
});

export type CreateReservationDto = z.infer<typeof createReservationSchema>;

export function parseCreateReservation(data: unknown): CreateReservationDto {
  return createReservationSchema.parse(data);
}

export const listReservationsQuerySchema = z.object({
  q: z.string().trim().optional(),
  bookId: z.string().optional(),
  memberId: z.string().optional(),
  status: z.enum(["pending", "fulfilled", "cancelled"]).optional(),
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["createdAt", "queuePosition"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type ListReservationsQueryDto = z.infer<
  typeof listReservationsQuerySchema
>;

export function parseListReservations(
  data: unknown,
): ListReservationsQueryDto {
  return listReservationsQuerySchema.parse(data);
}

// ── Borrowing history ──────────────────────────────────────────────────────

export const borrowingHistoryQuerySchema = z.object({
  page: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  limit: z
    .union([
      z.number().int().positive(),
      z.string().regex(/^\d+/).transform(Number),
    ])
    .optional(),
  sort: z.enum(["issuedAt", "dueDate", "status"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
});

export type BorrowingHistoryQueryDto = z.infer<
  typeof borrowingHistoryQuerySchema
>;

export function parseBorrowingHistory(
  data: unknown,
): BorrowingHistoryQueryDto {
  return borrowingHistoryQuerySchema.parse(data);
}
