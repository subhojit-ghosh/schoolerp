import { ApiProperty } from "@nestjs/swagger";

// ── Shared ────────────────────────────────────────────────────────────────

export class IdResponseDto {
  id!: string;
}

// ── Salary Components ─────────────────────────────────────────────────────

export class CreateSalaryComponentBodyDto {
  name!: string;

  @ApiProperty({ enum: ["earning", "deduction"] })
  type!: "earning" | "deduction";

  @ApiProperty({ enum: ["fixed", "percentage"] })
  calculationType!: "fixed" | "percentage";

  isTaxable?: boolean;
  isStatutory?: boolean;
  sortOrder?: number;
}

export class UpdateSalaryComponentBodyDto {
  name?: string;

  @ApiProperty({ enum: ["earning", "deduction"], required: false })
  type?: "earning" | "deduction";

  @ApiProperty({ enum: ["fixed", "percentage"], required: false })
  calculationType?: "fixed" | "percentage";

  isTaxable?: boolean;
  isStatutory?: boolean;
  sortOrder?: number;
}

export class UpdateSalaryComponentStatusBodyDto {
  @ApiProperty({ enum: ["active", "archived"] })
  status!: "active" | "archived";
}

export class SalaryComponentDto {
  id!: string;
  name!: string;

  @ApiProperty({ enum: ["earning", "deduction"] })
  type!: "earning" | "deduction";

  @ApiProperty({ enum: ["fixed", "percentage"] })
  calculationType!: "fixed" | "percentage";

  isTaxable!: boolean;
  isStatutory!: boolean;
  sortOrder!: number;

  @ApiProperty({ enum: ["active", "archived", "deleted"] })
  status!: "active" | "archived" | "deleted";

  createdAt!: string;
}

export class SalaryComponentListResultDto {
  rows!: SalaryComponentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListSalaryComponentsQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "archived", "deleted"], required: false })
  status?: "active" | "archived" | "deleted";

  @ApiProperty({ enum: ["earning", "deduction"], required: false })
  type?: "earning" | "deduction";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["name", "type", "sortOrder", "createdAt"],
    required: false,
  })
  sort?: "name" | "type" | "sortOrder" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Salary Templates ──────────────────────────────────────────────────────

export class TemplateComponentBodyDto {
  salaryComponentId!: string;

  @ApiProperty({ nullable: true })
  amountInPaise?: number | null;

  @ApiProperty({ nullable: true })
  percentage?: number | null;

  sortOrder?: number;
}

export class CreateSalaryTemplateBodyDto {
  name!: string;
  description?: string;

  @ApiProperty({ type: [TemplateComponentBodyDto] })
  components!: TemplateComponentBodyDto[];
}

export class UpdateSalaryTemplateBodyDto {
  name?: string;

  @ApiProperty({ nullable: true })
  description?: string | null;

  @ApiProperty({ type: [TemplateComponentBodyDto], required: false })
  components?: TemplateComponentBodyDto[];
}

export class UpdateSalaryTemplateStatusBodyDto {
  @ApiProperty({ enum: ["active", "archived"] })
  status!: "active" | "archived";
}

export class SalaryTemplateComponentDto {
  id!: string;
  salaryComponentId!: string;
  componentName!: string;

  @ApiProperty({ enum: ["earning", "deduction"] })
  componentType!: "earning" | "deduction";

  @ApiProperty({ enum: ["fixed", "percentage"] })
  calculationType!: "fixed" | "percentage";

  @ApiProperty({ nullable: true })
  amountInPaise!: number | null;

  @ApiProperty({ nullable: true })
  percentage!: number | null;

  sortOrder!: number;
}

export class SalaryTemplateDto {
  id!: string;
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ["active", "archived", "deleted"] })
  status!: "active" | "archived" | "deleted";

  createdAt!: string;
}

export class SalaryTemplateDetailDto extends SalaryTemplateDto {
  @ApiProperty({ type: [SalaryTemplateComponentDto] })
  components!: SalaryTemplateComponentDto[];
}

export class SalaryTemplateListResultDto {
  rows!: SalaryTemplateDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListSalaryTemplatesQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "archived", "deleted"], required: false })
  status?: "active" | "archived" | "deleted";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Salary Assignments ────────────────────────────────────────────────────

export class CreateSalaryAssignmentBodyDto {
  staffProfileId!: string;
  salaryTemplateId!: string;
  effectiveFrom!: string;
  overrides?: Record<
    string,
    { amountInPaise?: number | null; percentage?: number | null }
  >;
}

export class UpdateSalaryAssignmentBodyDto {
  effectiveFrom?: string;

  @ApiProperty({ nullable: true })
  overrides?: Record<
    string,
    { amountInPaise?: number | null; percentage?: number | null }
  > | null;
}

export class UpdateSalaryAssignmentStatusBodyDto {
  @ApiProperty({ enum: ["active", "archived"] })
  status!: "active" | "archived";
}

export class SalaryAssignmentDto {
  id!: string;
  staffProfileId!: string;
  staffName!: string;

  @ApiProperty({ nullable: true })
  staffEmployeeId!: string | null;

  @ApiProperty({ nullable: true })
  staffDesignation!: string | null;

  salaryTemplateId!: string;
  salaryTemplateName!: string;
  effectiveFrom!: string;
  ctcInPaise!: number;

  @ApiProperty({ nullable: true })
  overrides!: Record<
    string,
    { amountInPaise?: number | null; percentage?: number | null }
  > | null;

  @ApiProperty({ enum: ["active", "archived", "deleted"] })
  status!: "active" | "archived" | "deleted";

  createdAt!: string;
}

export class SalaryAssignmentListResultDto {
  rows!: SalaryAssignmentDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListSalaryAssignmentsQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "archived", "deleted"], required: false })
  status?: "active" | "archived" | "deleted";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["staffName", "effectiveFrom", "ctcInPaise", "createdAt"],
    required: false,
  })
  sort?: "staffName" | "effectiveFrom" | "ctcInPaise" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Payroll Runs ──────────────────────────────────────────────────────────

export class CreatePayrollRunBodyDto {
  month!: number;
  year!: number;

  @ApiProperty({ nullable: true })
  campusId?: string | null;

  workingDays?: number;
}

export class PayrollRunDto {
  id!: string;
  month!: number;
  year!: number;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  @ApiProperty({ nullable: true })
  campusName!: string | null;

  @ApiProperty({ enum: ["draft", "processed", "approved", "paid"] })
  status!: "draft" | "processed" | "approved" | "paid";

  totalEarningsInPaise!: number;
  totalDeductionsInPaise!: number;
  totalNetPayInPaise!: number;
  staffCount!: number;
  workingDays!: number;

  @ApiProperty({ nullable: true })
  processedAt!: string | null;

  @ApiProperty({ nullable: true })
  approvedAt!: string | null;

  @ApiProperty({ nullable: true })
  paidAt!: string | null;

  createdAt!: string;
}

export class PayrollRunListResultDto {
  rows!: PayrollRunDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListPayrollRunsQueryParamsDto {
  q?: string;
  year?: number;

  @ApiProperty({
    enum: ["draft", "processed", "approved", "paid"],
    required: false,
  })
  status?: "draft" | "processed" | "approved" | "paid";

  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["month", "year", "status", "createdAt"],
    required: false,
  })
  sort?: "month" | "year" | "status" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Payslips ──────────────────────────────────────────────────────────────

export class PayslipLineItemDto {
  id!: string;
  salaryComponentId!: string;
  componentName!: string;

  @ApiProperty({ enum: ["earning", "deduction"] })
  componentType!: "earning" | "deduction";

  amountInPaise!: number;
}

export class PayslipDto {
  id!: string;
  payrollRunId!: string;
  staffProfileId!: string;
  staffName!: string;

  @ApiProperty({ nullable: true })
  staffEmployeeId!: string | null;

  @ApiProperty({ nullable: true })
  staffDesignation!: string | null;

  @ApiProperty({ nullable: true })
  staffDepartment!: string | null;

  workingDays!: number;
  presentDays!: number;
  paidLeaveDays!: number;
  unpaidLeaveDays!: number;
  totalEarningsInPaise!: number;
  totalDeductionsInPaise!: number;
  netPayInPaise!: number;
  createdAt!: string;
}

export class PayslipDetailDto extends PayslipDto {
  month!: number;
  year!: number;

  @ApiProperty({ type: [PayslipLineItemDto] })
  lineItems!: PayslipLineItemDto[];
}

export class PayslipListResultDto {
  rows!: PayslipDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListPayslipsQueryParamsDto {
  q?: string;
  page?: number;
  limit?: number;

  @ApiProperty({
    enum: ["staffName", "netPayInPaise", "createdAt"],
    required: false,
  })
  sort?: "staffName" | "netPayInPaise" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Reports ───────────────────────────────────────────────────────────────

export class MonthlySummaryQueryParamsDto {
  month!: number;
  year!: number;
}

export class StaffHistoryQueryParamsDto {
  page?: number;
  limit?: number;
}

// ── Report Responses ─────────────────────────────────────────────────────

export class MonthlySummaryRunDto {
  id!: string;

  @ApiProperty({ nullable: true })
  campusId!: string | null;

  @ApiProperty({ nullable: true })
  campusName!: string | null;

  @ApiProperty({ enum: ["draft", "processed", "approved", "paid"] })
  status!: "draft" | "processed" | "approved" | "paid";

  totalEarningsInPaise!: number;
  totalDeductionsInPaise!: number;
  totalNetPayInPaise!: number;
  staffCount!: number;
}

export class MonthlySummaryResponseDto {
  month!: number;
  year!: number;

  @ApiProperty({ type: [MonthlySummaryRunDto] })
  runs!: MonthlySummaryRunDto[];
}

export class StaffHistoryRowDto {
  id!: string;
  month!: number;
  year!: number;
  workingDays!: number;
  presentDays!: number;
  paidLeaveDays!: number;
  unpaidLeaveDays!: number;
  totalEarningsInPaise!: number;
  totalDeductionsInPaise!: number;
  netPayInPaise!: number;
  createdAt!: string;
}

export class StaffHistoryResponseDto {
  rows!: StaffHistoryRowDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}
