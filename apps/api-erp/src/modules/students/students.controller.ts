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
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { ScopeGuard } from "../auth/scope.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import { CurrentScopes } from "../auth/current-scopes.decorator";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
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
  StudentSummaryDto,
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
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.STUDENTS)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "List students for the current tenant institution" })
  @ApiOkResponse({ type: ListStudentsResultDto })
  listStudents(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListStudentsQueryDto,
  ) {
    return this.studentsService.listStudents(
      institution.id,
      authSession,
      scopes,
      parseListStudentsQuery(query),
    );
  }

  @Get(API_ROUTES.OPTIONS)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({
    summary:
      "List student options for select controls in the current tenant institution",
  })
  @ApiOkResponse({ type: StudentOptionDto, isArray: true })
  listStudentOptions(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.listStudentOptions(
      institution.id,
      authSession,
      scopes,
    );
  }

  @Post()
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
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

  @Get(`:studentId/${API_ROUTES.SUMMARY}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({
    summary: "Get an operational Student 360 summary for the current tenant institution",
  })
  @ApiOkResponse({ type: StudentSummaryDto })
  getStudentSummary(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.getStudentSummary(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Get(":studentId")
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({
    summary: "Get a single student for the current tenant institution",
  })
  @ApiOkResponse({ type: StudentDto })
  getStudent(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.getStudent(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Patch(":studentId")
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
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
