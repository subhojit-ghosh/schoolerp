import { ApiProperty } from "@nestjs/swagger";

// ── Categories ──────────────────────────────────────────────────────────────

export class CreateCategoryBodyDto {
  name!: string;
  description?: string;
  budgetHeadCode?: string;
  parentCategoryId?: string;
}

export class UpdateCategoryBodyDto {
  name?: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty({ nullable: true })
  budgetHeadCode?: string | null;

  @ApiProperty({ nullable: true })
  parentCategoryId?: string | null;
}

export class UpdateCategoryStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class ExpenseCategoryDto {
  id!: string;
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true })
  budgetHeadCode!: string | null;

  @ApiProperty({ nullable: true })
  parentCategoryId!: string | null;

  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";

  createdAt!: string;
}

export class ExpenseCategoryListResultDto {
  rows!: ExpenseCategoryDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListCategoriesQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive"], required: false })
  status?: "active" | "inactive";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Expenses ────────────────────────────────────────────────────────────────

export class CreateExpenseBodyDto {
  campusId?: string;
  categoryId!: string;
  title!: string;
  description?: string;
  amountInPaise!: number;
  expenseDate!: string;
  departmentName?: string;
  vendorName?: string;
  referenceNumber?: string;
  receiptUploadId?: string;
}

export class UpdateExpenseBodyDto {
  @ApiProperty({ nullable: true })
  campusId?: string | null;

  categoryId?: string;
  title?: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  amountInPaise?: number;
  expenseDate?: string;

  @ApiProperty({ nullable: true })
  departmentName?: string | null;

  @ApiProperty({ nullable: true })
  vendorName?: string | null;

  @ApiProperty({ nullable: true })
  referenceNumber?: string | null;

  @ApiProperty({ nullable: true })
  receiptUploadId?: string | null;
}

export class ExpenseDto {
  id!: string;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  categoryId!: string;
  categoryName!: string;
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  amountInPaise!: number;
  expenseDate!: string;

  @ApiProperty({ nullable: true })
  departmentName!: string | null;

  @ApiProperty({ nullable: true })
  vendorName!: string | null;

  @ApiProperty({ nullable: true })
  referenceNumber!: string | null;

  @ApiProperty({ enum: ["draft", "submitted", "approved", "rejected", "paid"] })
  status!: string;

  submittedByMemberId!: string;
  submittedByName!: string;

  @ApiProperty({ nullable: true })
  approvedByMemberId!: string | null;

  @ApiProperty({ nullable: true })
  approvedByName!: string | null;

  @ApiProperty({ nullable: true })
  approvedAt!: string | null;

  @ApiProperty({ nullable: true })
  rejectionReason!: string | null;

  @ApiProperty({ nullable: true })
  paidAt!: string | null;

  @ApiProperty({ nullable: true })
  paymentMethod!: string | null;

  @ApiProperty({ nullable: true })
  paymentReference!: string | null;

  createdAt!: string;
}

export class ExpenseDetailDto extends ExpenseDto {
  @ApiProperty({ nullable: true })
  receiptUploadId!: string | null;

  updatedAt!: string;
}

export class ExpenseListResultDto {
  rows!: ExpenseDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListExpensesQueryParamsDto {
  q?: string;

  @ApiProperty({
    enum: ["draft", "submitted", "approved", "rejected", "paid"],
    required: false,
  })
  status?: "draft" | "submitted" | "approved" | "rejected" | "paid";

  categoryId?: string;
  campusId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["expenseDate", "amountInPaise", "createdAt"],
    required: false,
  })
  sort?: "expenseDate" | "amountInPaise" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Workflow ────────────────────────────────────────────────────────────────

export class RejectExpenseBodyDto {
  rejectionReason!: string;
}

export class MarkPaidBodyDto {
  paymentMethod!: string;
  paymentReference?: string;
}

// ── Summary ─────────────────────────────────────────────────────────────────

export class ExpenseSummaryQueryParamsDto {
  campusId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class ExpenseSummaryByCategoryDto {
  categoryId!: string;
  categoryName!: string;
  totalAmountInPaise!: number;
  count!: number;
}

export class ExpenseSummaryByMonthDto {
  month!: string;
  totalAmountInPaise!: number;
  count!: number;
}

export class ExpenseSummaryByDepartmentDto {
  departmentName!: string;
  totalAmountInPaise!: number;
  count!: number;
}

export class ExpenseSummaryDto {
  byCategory!: ExpenseSummaryByCategoryDto[];
  byMonth!: ExpenseSummaryByMonthDto[];
  byDepartment!: ExpenseSummaryByDepartmentDto[];
  totalAmountInPaise!: number;
  totalCount!: number;
}
