import { ApiProperty } from "@nestjs/swagger";

// ── Records ─────────────────────────────────────────────────────────────────

export class CreateRecordBodyDto {
  campusId?: string;

  @ApiProperty({
    enum: [
      "donation",
      "grant",
      "government_aid",
      "rental",
      "canteen",
      "admission_fee",
      "other",
    ],
  })
  category!: string;

  title!: string;
  description?: string;
  amountInPaise!: number;
  incomeDate!: string;
  sourceEntity?: string;
  referenceNumber?: string;
  receiptUploadId?: string;
}

export class UpdateRecordBodyDto {
  @ApiProperty({ nullable: true })
  campusId?: string | null;

  @ApiProperty({
    enum: [
      "donation",
      "grant",
      "government_aid",
      "rental",
      "canteen",
      "admission_fee",
      "other",
    ],
    required: false,
  })
  category?: string;

  title?: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  amountInPaise?: number;
  incomeDate?: string;

  @ApiProperty({ nullable: true })
  sourceEntity?: string | null;

  @ApiProperty({ nullable: true })
  referenceNumber?: string | null;

  @ApiProperty({ nullable: true })
  receiptUploadId?: string | null;
}

export class IncomeRecordDto {
  id!: string;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  @ApiProperty({
    enum: [
      "donation",
      "grant",
      "government_aid",
      "rental",
      "canteen",
      "admission_fee",
      "other",
    ],
  })
  category!: string;

  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  amountInPaise!: number;
  incomeDate!: string;

  @ApiProperty({ nullable: true })
  sourceEntity!: string | null;

  @ApiProperty({ nullable: true })
  referenceNumber!: string | null;

  recordedByMemberId!: string;
  recordedByName!: string;

  createdAt!: string;
}

export class IncomeRecordDetailDto extends IncomeRecordDto {
  @ApiProperty({ nullable: true })
  receiptUploadId!: string | null;

  updatedAt!: string;
}

export class IncomeRecordListResultDto {
  rows!: IncomeRecordDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListRecordsQueryParamsDto {
  q?: string;

  @ApiProperty({
    enum: [
      "donation",
      "grant",
      "government_aid",
      "rental",
      "canteen",
      "admission_fee",
      "other",
    ],
    required: false,
  })
  category?: string;

  campusId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["incomeDate", "amountInPaise", "createdAt"],
    required: false,
  })
  sort?: "incomeDate" | "amountInPaise" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Summary ─────────────────────────────────────────────────────────────────

export class IncomeSummaryQueryParamsDto {
  campusId?: string;
  dateFrom?: string;
  dateTo?: string;
}

export class IncomeSummaryByCategoryDto {
  category!: string;
  totalAmountInPaise!: number;
  count!: number;
}

export class IncomeSummaryByMonthDto {
  month!: string;
  totalAmountInPaise!: number;
  count!: number;
}

export class IncomeSummaryDto {
  byCategory!: IncomeSummaryByCategoryDto[];
  byMonth!: IncomeSummaryByMonthDto[];
  totalAmountInPaise!: number;
  totalCount!: number;
}
