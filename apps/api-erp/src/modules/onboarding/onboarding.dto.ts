import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateInstitutionOnboardingBodyDto {
  @ApiProperty()
  institutionName!: string;

  @ApiProperty()
  institutionSlug!: string;

  @ApiPropertyOptional()
  institutionShortName?: string;

  @ApiProperty()
  campusName!: string;

  @ApiPropertyOptional()
  campusSlug?: string;

  @ApiProperty()
  adminName!: string;

  @ApiProperty()
  mobile!: string;

  @ApiPropertyOptional({ nullable: true })
  email?: string | null;

  @ApiProperty()
  password!: string;
}
