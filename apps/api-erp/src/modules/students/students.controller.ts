import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateStudentBodyDto,
  ListStudentsQueryDto,
  ListStudentsResultDto,
  StudentOptionDto,
  StudentDto,
  UpdateStudentBodyDto,
} from "./students.dto";
import {
  parseCreateStudent,
  parseListStudentsQuery,
  parseUpdateStudent,
} from "./students.schemas";
import { StudentsService } from "./students.service";

@ApiTags(API_DOCS.TAGS.STUDENTS)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(API_ROUTES.STUDENTS)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: "List students for the current tenant institution" })
  @ApiOkResponse({ type: ListStudentsResultDto })
  listStudents(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Query() query: ListStudentsQueryDto,
  ) {
    return this.studentsService.listStudents(
      institution.id,
      authSession,
      parseListStudentsQuery(query),
    );
  }

  @Get(API_ROUTES.OPTIONS)
  @ApiOperation({
    summary:
      "List student options for select controls in the current tenant institution",
  })
  @ApiOkResponse({ type: StudentOptionDto, isArray: true })
  listStudentOptions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.studentsService.listStudentOptions(institution.id, authSession);
  }

  @Post()
  @ApiOperation({
    summary: "Create a student and link guardians for the current tenant",
  })
  @ApiBody({ type: CreateStudentBodyDto })
  @ApiOkResponse({ type: StudentDto })
  createStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateStudentBodyDto,
  ) {
    return this.studentsService.createStudent(
      institution.id,
      authSession,
      parseCreateStudent(body),
    );
  }

  @Get(":studentId")
  @ApiOperation({
    summary: "Get a single student for the current tenant institution",
  })
  @ApiOkResponse({ type: StudentDto })
  getStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.studentsService.getStudent(
      institution.id,
      studentId,
      authSession,
    );
  }

  @Patch(":studentId")
  @ApiOperation({
    summary: "Update a student and reconcile guardians for the current tenant",
  })
  @ApiBody({ type: UpdateStudentBodyDto })
  @ApiOkResponse({ type: StudentDto })
  updateStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpdateStudentBodyDto,
  ) {
    return this.studentsService.updateStudent(
      institution.id,
      studentId,
      authSession,
      parseUpdateStudent(body),
    );
  }
}
