import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  AttendanceClassSectionDto,
  AttendanceDayDto,
  AttendanceClassSectionQueryParamsDto,
  AttendanceDayQueryParamsDto,
  AttendanceDayViewItemDto,
  AttendanceDayViewQueryParamsDto,
  UpsertAttendanceDayBodyDto,
} from "./attendance.dto";
import {
  parseAttendanceClassSectionQuery,
  parseAttendanceDayQuery,
  parseAttendanceDayViewQuery,
  parseUpsertAttendanceDay,
} from "./attendance.schemas";
import { AttendanceService } from "./attendance.service";

@ApiTags(API_DOCS.TAGS.ATTENDANCE)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.ATTENDANCE}`)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.CLASS_SECTIONS)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List available class-section combinations for attendance" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiQuery({ name: "campusId", type: String })
  @ApiOkResponse({ type: AttendanceClassSectionDto, isArray: true })
  listClassSections(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: AttendanceClassSectionQueryParamsDto,
  ) {
    return this.attendanceService.listClassSections(
      institutionId,
      authSession,
      parseAttendanceClassSectionQuery(query),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.DAY)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get the attendance roster for a class-section and day" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: AttendanceDayDto })
  listAttendanceDay(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: AttendanceDayQueryParamsDto,
  ) {
    return this.attendanceService.getAttendanceDay(
      institutionId,
      authSession,
      parseAttendanceDayQuery(query),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post(API_ROUTES.DAY)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create or update daily attendance for a class-section" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: UpsertAttendanceDayBodyDto })
  @ApiOkResponse({ type: AttendanceDayDto })
  upsertAttendanceDay(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpsertAttendanceDayBodyDto,
  ) {
    return this.attendanceService.upsertAttendanceDay(
      institutionId,
      authSession,
      parseUpsertAttendanceDay(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.DAY_VIEW)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List simple attendance summaries for a day" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiQuery({ name: "attendanceDate", type: String })
  @ApiOkResponse({ type: AttendanceDayViewItemDto, isArray: true })
  listAttendanceDayView(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: AttendanceDayViewQueryParamsDto,
  ) {
    return this.attendanceService.listAttendanceDayView(
      institutionId,
      authSession,
      parseAttendanceDayViewQuery(query),
    );
  }
}
