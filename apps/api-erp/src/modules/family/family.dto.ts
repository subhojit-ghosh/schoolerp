import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { AuthLinkedStudentDto } from "../auth/auth.dto";
import { CalendarEventDto } from "../calendar/calendar.dto";
import { AnnouncementDto } from "../communications/communications.dto";
import { StudentSummaryDto } from "../students/students.dto";
import { TimetableViewDto } from "../timetable/timetable.dto";

export class FamilyOverviewDto {
  @ApiProperty({
    type: () => AuthLinkedStudentDto,
    isArray: true,
  })
  linkedStudents!: AuthLinkedStudentDto[];

  @ApiProperty({
    type: () => StudentSummaryDto,
    isArray: true,
  })
  studentSummaries!: StudentSummaryDto[];

  @ApiPropertyOptional({ nullable: true })
  selectedStudentId!: string | null;

  @ApiPropertyOptional({
    type: () => StudentSummaryDto,
    nullable: true,
  })
  selectedStudentSummary!: StudentSummaryDto | null;

  @ApiPropertyOptional({
    type: () => TimetableViewDto,
    nullable: true,
  })
  selectedTimetable!: TimetableViewDto | null;

  @ApiProperty({
    type: () => AnnouncementDto,
    isArray: true,
  })
  announcements!: AnnouncementDto[];

  @ApiProperty({
    type: () => CalendarEventDto,
    isArray: true,
  })
  calendarEvents!: CalendarEventDto[];
}
