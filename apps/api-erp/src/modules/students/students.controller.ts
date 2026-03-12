import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  CreateStudentBodyDto,
  StudentDto,
  UpdateStudentBodyDto,
} from "./students.dto";
import { parseCreateStudent, parseUpdateStudent } from "./students.schemas";
import { StudentsService } from "./students.service";

@ApiTags(API_DOCS.TAGS.STUDENTS)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.STUDENTS}`)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List students for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: StudentDto, isArray: true })
  listStudents(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.studentsService.listStudents(
      institutionId,
      authSession.user.id,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a student and link guardians" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateStudentBodyDto })
  @ApiOkResponse({ type: StudentDto })
  createStudent(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateStudentBodyDto,
  ) {
    return this.studentsService.createStudent(
      institutionId,
      authSession.user.id,
      parseCreateStudent(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(":studentId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Get a single student for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "studentId", type: String })
  @ApiOkResponse({ type: StudentDto })
  getStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.studentsService.getStudent(
      institutionId,
      studentId,
      authSession.user.id,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch(":studentId")
  @ApiCookieAuth()
  @ApiOperation({ summary: "Update a student and reconcile guardians" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "studentId", type: String })
  @ApiBody({ type: UpdateStudentBodyDto })
  @ApiOkResponse({ type: StudentDto })
  updateStudent(
    @Param("institutionId") institutionId: string,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateStudentBodyDto,
  ) {
    return this.studentsService.updateStudent(
      institutionId,
      studentId,
      authSession.user.id,
      parseUpdateStudent(body),
    );
  }
}
