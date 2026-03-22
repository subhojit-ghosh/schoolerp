import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SORT_ORDERS, STATUS } from "../../constants";
import { sortableInstitutionColumns } from "./institutions.schemas";

export class ListInstitutionsQueryDto {
  @ApiPropertyOptional({ minimum: 1, type: Number })
  page?: number;

  @ApiPropertyOptional({ type: Number })
  limit?: number;

  @ApiPropertyOptional()
  q?: string;

  @ApiPropertyOptional({
    enum: Object.values(sortableInstitutionColumns),
  })
  sort?: keyof typeof sortableInstitutionColumns;

  @ApiPropertyOptional({
    enum: Object.values(SORT_ORDERS),
  })
  order?: (typeof SORT_ORDERS)[keyof typeof SORT_ORDERS];
}

export class InstitutionDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  institutionType!: string | null;

  @ApiProperty({
    enum: Object.values(STATUS.ORG),
    nullable: true,
  })
  status!: (typeof STATUS.ORG)[keyof typeof STATUS.ORG] | null;

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}

export class InstitutionCountsDto {
  @ApiProperty()
  total!: number;

  @ApiProperty()
  active!: number;

  @ApiProperty()
  suspended!: number;
}

export class UpdateBrandingBodyDto {
  @ApiProperty({ description: "Institution display name" })
  name!: string;

  @ApiProperty({ description: "Short name or abbreviation" })
  shortName!: string;

  @ApiPropertyOptional({ description: "Logo image URL", nullable: true })
  logoUrl?: string;

  @ApiPropertyOptional({ description: "Favicon URL", nullable: true })
  faviconUrl?: string;

  @ApiProperty({ description: "Primary color as a hex string, e.g. #8a5a44" })
  primaryColor!: string;

  @ApiProperty({ description: "Accent color as a hex string, e.g. #d59f6a" })
  accentColor!: string;

  @ApiProperty({ description: "Sidebar color as a hex string, e.g. #32241c" })
  sidebarColor!: string;

  @ApiPropertyOptional({ description: "Heading font family, e.g. Outfit" })
  fontHeading?: string;

  @ApiPropertyOptional({
    description: "Body font family, e.g. Libre Baskerville",
  })
  fontBody?: string;

  @ApiPropertyOptional({
    description: "Monospace font family, e.g. IBM Plex Mono",
  })
  fontMono?: string;

  @ApiPropertyOptional({ enum: ["sharp", "default", "rounded", "pill"] })
  borderRadius?: string;

  @ApiPropertyOptional({ enum: ["compact", "default", "comfortable"] })
  uiDensity?: string;
}

export class UpdateBrandingResponseDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  shortName!: string;

  @ApiProperty({ nullable: true })
  logoUrl!: string | null;

  @ApiProperty({ nullable: true })
  faviconUrl!: string | null;

  @ApiProperty()
  primaryColor!: string;

  @ApiProperty()
  accentColor!: string;

  @ApiProperty()
  sidebarColor!: string;

  @ApiProperty({ nullable: true })
  fontHeading!: string | null;

  @ApiProperty({ nullable: true })
  fontBody!: string | null;

  @ApiProperty({ nullable: true })
  fontMono!: string | null;

  @ApiProperty({
    nullable: true,
    enum: ["sharp", "default", "rounded", "pill"],
  })
  borderRadius!: string | null;

  @ApiProperty({ nullable: true, enum: ["compact", "default", "comfortable"] })
  uiDensity!: string | null;

  @ApiProperty()
  brandingVersion!: number;
}

export class ListInstitutionsResultDto {
  @ApiProperty({
    type: () => InstitutionDto,
    isArray: true,
  })
  rows!: InstitutionDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;

  @ApiProperty()
  pageCount!: number;
}
