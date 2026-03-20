import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CalendarEventDto } from "../calendar/calendar.dto";
import { AnnouncementDto } from "../communications/communications.dto";
import { ExamReportCardDto } from "../exams/exams.dto";
import { StudentSummaryDto } from "../students/students.dto";
import { TimetableViewDto } from "../timetable/timetable.dto";

export class StudentPortalOverviewDto {
  @ApiProperty({
    type: () => StudentSummaryDto,
  })
  studentSummary!: StudentSummaryDto;

  @ApiPropertyOptional({
    type: () => TimetableViewDto,
    nullable: true,
  })
  timetable!: TimetableViewDto | null;

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

  @ApiPropertyOptional({ nullable: true })
  selectedReportCardTermId!: string | null;

  @ApiPropertyOptional({
    type: () => ExamReportCardDto,
    nullable: true,
  })
  selectedReportCard!: ExamReportCardDto | null;
}
