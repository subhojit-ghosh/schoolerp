import { ApiProperty } from "@nestjs/swagger";
import { STATUS } from "../../constants";

export class CreateAcademicYearBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  makeCurrent!: boolean;
}

export class AcademicYearDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  isCurrent!: boolean;

  @ApiProperty({
    enum: Object.values(STATUS.ACADEMIC_YEAR),
  })
  status!: (typeof STATUS.ACADEMIC_YEAR)[keyof typeof STATUS.ACADEMIC_YEAR];

  @ApiProperty({
    type: String,
    format: "date-time",
  })
  createdAt!: string;
}
