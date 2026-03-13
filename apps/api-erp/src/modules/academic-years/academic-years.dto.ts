import { ApiProperty } from "@nestjs/swagger";
import { STATUS } from "../../constants";

export class AcademicYearWriteBodyDto {
  @ApiProperty()
  name!: string;

  @ApiProperty()
  startDate!: string;

  @ApiProperty()
  endDate!: string;

  @ApiProperty()
  isCurrent!: boolean;
}

export class CreateAcademicYearBodyDto extends AcademicYearWriteBodyDto {}

export class UpdateAcademicYearBodyDto extends AcademicYearWriteBodyDto {}

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
