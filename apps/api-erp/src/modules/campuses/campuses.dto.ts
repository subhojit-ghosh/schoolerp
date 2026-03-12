import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { STATUS, type CampusStatus } from "../../constants";

export class CreateCampusBodyDto {
  @ApiProperty()
  name!: string;

  @ApiPropertyOptional()
  slug?: string;

  @ApiPropertyOptional({ nullable: true })
  code?: string | null;

  @ApiPropertyOptional()
  isDefault?: boolean;
}

export class CampusDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  organizationId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  slug!: string;

  @ApiProperty({ nullable: true })
  code!: string | null;

  @ApiProperty()
  isDefault!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.CAMPUS),
  })
  status!: CampusStatus;
}
