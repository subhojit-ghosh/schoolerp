import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  ADMISSION_APPLICATION_STATUSES,
  ADMISSION_ENQUIRY_STATUSES,
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
  campusId!: string;
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

  campusId!: string;
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
  createdAt!: string;
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
