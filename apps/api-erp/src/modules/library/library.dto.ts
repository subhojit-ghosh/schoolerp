import { ApiProperty } from "@nestjs/swagger";

export class CreateBookBodyDto {
  title!: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  genre?: string;
  totalCopies?: number;
}

export class UpdateBookBodyDto {
  title?: string;
  author?: string;
  isbn?: string;
  publisher?: string;
  genre?: string;
  totalCopies?: number;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";
}

export class BookDto {
  id!: string;
  title!: string;

  @ApiProperty({ nullable: true })
  author!: string | null;

  @ApiProperty({ nullable: true })
  isbn!: string | null;

  @ApiProperty({ nullable: true })
  publisher!: string | null;

  @ApiProperty({ nullable: true })
  genre!: string | null;

  totalCopies!: number;
  availableCopies!: number;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class BookListResultDto {
  rows!: BookDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListBooksQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["title", "author", "createdAt", "availableCopies"],
    required: false,
  })
  sort?: "title" | "author" | "createdAt" | "availableCopies";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

export class IssueBookBodyDto {
  bookId!: string;
  memberId!: string;
  dueDate!: string;
}

export class TransactionDto {
  id!: string;
  bookId!: string;
  bookTitle!: string;

  @ApiProperty({ nullable: true })
  bookIsbn!: string | null;

  memberId!: string;
  memberName!: string;

  @ApiProperty({ nullable: true })
  memberEmployeeId!: string | null;

  issuedAt!: string;
  dueDate!: string;

  @ApiProperty({ nullable: true })
  returnedAt!: string | null;

  fineAmount!: number;
  finePaid!: boolean;

  @ApiProperty({ enum: ["issued", "returned", "overdue"] })
  status!: "issued" | "returned" | "overdue";

  createdAt!: string;
}

export class TransactionListResultDto {
  rows!: TransactionDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListTransactionsQueryParamsDto {
  q?: string;
  memberId?: string;
  bookId?: string;

  @ApiProperty({ enum: ["issued", "returned", "overdue"], required: false })
  status?: "issued" | "returned" | "overdue";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["issuedAt", "dueDate", "status"], required: false })
  sort?: "issuedAt" | "dueDate" | "status";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

export class ReturnBookBodyDto {
  fineAmount?: number;
}
