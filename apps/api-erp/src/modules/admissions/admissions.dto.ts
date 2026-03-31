import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ADMISSION_FORM_FIELD_TYPES,
  ADMISSION_APPLICATION_STATUSES,
  ADMISSION_DOCUMENT_STATUS,
  ADMISSION_ENQUIRY_STATUSES,
  type AdmissionDocumentStatus,
  type AdmissionFormFieldOption,
  type AdmissionFormFieldScope,
  type AdmissionFormFieldType,
  type AdmissionApplicationStatus,
  type AdmissionEnquiryStatus,
} from "@repo/contracts";
import { SORT_ORDERS } from "../../constants";
import {
  sortableAdmissionApplicationColumns,
  sortableAdmissionEnquiryColumns,
} from "./admissions.schemas";

export class ListAdmissionEnquiriesQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableAdmissionEnquiryColumns),
  })
  sort?: keyof typeof sortableAdmissionEnquiryColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class ListAdmissionApplicationsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableAdmissionApplicationColumns),
  })
  sort?: keyof typeof sortableAdmissionApplicationColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class CreateAdmissionEnquiryBodyDto {
  studentName!: string;
  guardianName!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  source?: string | null;

  @ApiProperty({
    enum: Object.values(ADMISSION_ENQUIRY_STATUSES),
  })
  status!: AdmissionEnquiryStatus;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class UpdateAdmissionEnquiryBodyDto extends CreateAdmissionEnquiryBodyDto {}

export class CreateAdmissionApplicationBodyDto {
  @ApiPropertyOptional({ nullable: true })
  enquiryId?: string | null;

  studentFirstName!: string;

  @ApiPropertyOptional({ nullable: true })
  studentLastName?: string | null;

  guardianName!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  desiredClassName?: string | null;

  @ApiPropertyOptional({ nullable: true })
  desiredSectionName?: string | null;

  @ApiProperty({
    enum: Object.values(ADMISSION_APPLICATION_STATUSES),
  })
  status!: AdmissionApplicationStatus;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  customFieldValues?: Record<string, unknown> | null;
}

export class UpdateAdmissionApplicationBodyDto extends CreateAdmissionApplicationBodyDto {}

export class AdmissionEnquiryDto {
  id!: string;
  institutionId!: string;
  campusId!: string;
  campusName!: string;
  studentName!: string;
  guardianName!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  source!: string | null;

  @ApiProperty({
    enum: Object.values(ADMISSION_ENQUIRY_STATUSES),
  })
  status!: AdmissionEnquiryStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
  createdAt!: string;
}

export class AdmissionApplicationDto {
  id!: string;
  institutionId!: string;

  @ApiPropertyOptional({ nullable: true })
  enquiryId!: string | null;

  campusId!: string;
  campusName!: string;
  studentFirstName!: string;

  @ApiPropertyOptional({ nullable: true })
  studentLastName!: string | null;

  guardianName!: string;
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email!: string | null;

  @ApiPropertyOptional({ nullable: true })
  desiredClassName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  desiredSectionName!: string | null;

  @ApiProperty({
    enum: Object.values(ADMISSION_APPLICATION_STATUSES),
  })
  status!: AdmissionApplicationStatus;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    nullable: true,
  })
  customFieldValues!: Record<string, unknown> | null;
  createdAt!: string;
}

export class AdmissionFormFieldOptionDto implements AdmissionFormFieldOption {
  label!: string;
  value!: string;
}

export class ListAdmissionFormFieldsQueryDto {
  @ApiPropertyOptional({
    enum: Object.values(ADMISSION_FORM_FIELD_SCOPES),
  })
  scope?: AdmissionFormFieldScope;
}

export class UpsertAdmissionFormFieldBodyDto {
  key!: string;
  label!: string;

  @ApiProperty({
    enum: Object.values(ADMISSION_FORM_FIELD_SCOPES),
  })
  scope!: AdmissionFormFieldScope;

  @ApiProperty({
    enum: Object.values(ADMISSION_FORM_FIELD_TYPES),
  })
  fieldType!: AdmissionFormFieldType;

  @ApiPropertyOptional({ nullable: true })
  placeholder?: string | null;

  @ApiPropertyOptional({ nullable: true })
  helpText?: string | null;

  required!: boolean;
  active!: boolean;

  @ApiPropertyOptional({
    type: () => AdmissionFormFieldOptionDto,
    isArray: true,
    nullable: true,
  })
  options?: AdmissionFormFieldOptionDto[] | null;

  sortOrder!: number;
}

export class AdmissionFormFieldDto {
  id!: string;
  institutionId!: string;
  key!: string;
  label!: string;

  @ApiProperty({
    enum: Object.values(ADMISSION_FORM_FIELD_SCOPES),
  })
  scope!: AdmissionFormFieldScope;

  @ApiProperty({
    enum: Object.values(ADMISSION_FORM_FIELD_TYPES),
  })
  fieldType!: AdmissionFormFieldType;

  @ApiPropertyOptional({ nullable: true })
  placeholder!: string | null;

  @ApiPropertyOptional({ nullable: true })
  helpText!: string | null;

  required!: boolean;
  active!: boolean;

  @ApiPropertyOptional({
    type: () => AdmissionFormFieldOptionDto,
    isArray: true,
    nullable: true,
  })
  options!: AdmissionFormFieldOptionDto[] | null;

  sortOrder!: number;
  createdAt!: string;
  updatedAt!: string;
}

export class ListAdmissionEnquiriesResultDto {
  @ApiProperty({ type: () => AdmissionEnquiryDto, isArray: true })
  rows!: AdmissionEnquiryDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListAdmissionApplicationsResultDto {
  @ApiProperty({ type: () => AdmissionApplicationDto, isArray: true })
  rows!: AdmissionApplicationDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListAdmissionFormFieldsResultDto {
  @ApiProperty({ type: () => AdmissionFormFieldDto, isArray: true })
  rows!: AdmissionFormFieldDto[];
}

// ── Document checklist DTOs ─────────────────────────────────────────────────

export class CreateDocumentChecklistItemBodyDto {
  documentName!: string;
  isRequired!: boolean;
  sortOrder!: number;
  isActive!: boolean;
}

export class UpdateDocumentChecklistItemBodyDto extends CreateDocumentChecklistItemBodyDto {}

export class DocumentChecklistItemDto {
  id!: string;
  institutionId!: string;
  documentName!: string;
  isRequired!: boolean;
  sortOrder!: number;
  isActive!: boolean;
  createdAt!: string;
  updatedAt!: string;
}

export class ListDocumentChecklistResultDto {
  @ApiProperty({ type: () => DocumentChecklistItemDto, isArray: true })
  rows!: DocumentChecklistItemDto[];
}

// ── Application documents DTOs ──────────────────────────────────────────────

export class UpsertApplicationDocumentBodyDto {
  checklistItemId!: string;

  @ApiProperty({
    enum: Object.values(ADMISSION_DOCUMENT_STATUS),
  })
  status!: AdmissionDocumentStatus;

  @ApiPropertyOptional({ nullable: true })
  uploadUrl?: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class VerifyRejectApplicationDocumentBodyDto {
  @ApiProperty({
    enum: ["verified", "rejected"],
  })
  status!: "verified" | "rejected";

  @ApiPropertyOptional({ nullable: true })
  notes?: string | null;
}

export class ApplicationDocumentDto {
  id!: string;
  institutionId!: string;
  applicationId!: string;
  checklistItemId!: string;

  @ApiProperty({
    enum: Object.values(ADMISSION_DOCUMENT_STATUS),
  })
  status!: AdmissionDocumentStatus;

  @ApiPropertyOptional({ nullable: true })
  uploadUrl!: string | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedByMemberId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  verifiedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  notes!: string | null;
  createdAt!: string;
  updatedAt!: string;
}

export class ListApplicationDocumentsResultDto {
  @ApiProperty({ type: () => ApplicationDocumentDto, isArray: true })
  rows!: ApplicationDocumentDto[];
}

// ── Convert to student DTOs ─────────────────────────────────────────────────

export class ConvertToStudentBodyDto {
  admissionNumber!: string;
  classId!: string;
  sectionId!: string;
}

export class ConvertToStudentResultDto {
  applicationId!: string;
  studentId!: string;
}

// ── Waitlist DTOs ───────────────────────────────────────────────────────────

export class WaitlistApplicationBodyDto {
  waitlistPosition!: number;
}

export class WaitlistResultDto {
  applicationId!: string;

  @ApiProperty({
    enum: ["waitlisted"],
  })
  status!: string;
  waitlistPosition!: number;
}

export class PromoteWaitlistResultDto {
  promotedApplicationId!: string;

  @ApiProperty({
    enum: ["approved"],
  })
  status!: string;
}

// ── Registration fee DTOs ───────────────────────────────────────────────────

export class RecordRegistrationFeeBodyDto {
  amountInPaise!: number;
}

export class RegistrationFeeResultDto {
  applicationId!: string;
  registrationFeeAmountInPaise!: number;
  registrationFeePaidAt!: string;
}
