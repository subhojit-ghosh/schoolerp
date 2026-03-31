import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
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
  CreateDisciplinaryRecordBodyDto,
  CreateSiblingLinkBodyDto,
  CreateStudentBodyDto,
  DisciplinaryRecordDto,
  IssueTransferCertificateBodyDto,
  ListStudentsQueryDto,
  ListStudentsResultDto,
  SiblingLinkDto,
  StudentDto,
  StudentMedicalRecordDto,
  StudentOptionDto,
  StudentSummaryDto,
  TransferCertificateDto,
  UpdateStudentBodyDto,
  UpsertMedicalRecordBodyDto,
} from "./students.dto";
import {
  parseCreateDisciplinaryRecord,
  parseCreateSiblingLink,
  parseCreateStudent,
  parseIssueTransferCertificate,
  parseListStudentsQuery,
  parseUpdateStudent,
  parseUpsertMedicalRecord,
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
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateStudentBodyDto,
  ) {
    return this.studentsService.createStudent(
      institution.id,
      authSession,
      scopes,
      parseCreateStudent(body),
    );
  }

  @Get(`:studentId/${API_ROUTES.SUMMARY}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({
    summary:
      "Get an operational Student 360 summary for the current tenant institution",
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
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpdateStudentBodyDto,
  ) {
    return this.studentsService.updateStudent(
      institution.id,
      studentId,
      authSession,
      scopes,
      parseUpdateStudent(body),
    );
  }

  @Post(`:studentId/transfer-section`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Transfer a student to a different class/section mid-year",
  })
  transferSection(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body()
    body: { targetClassId: string; targetSectionId: string; reason?: string },
  ) {
    return this.studentsService.transferSection(
      institution.id,
      studentId,
      authSession,
      body,
    );
  }

  // ── Sibling Links ──────────────────────────────────────────────────────────

  @Get(`:studentId/${API_ROUTES.SIBLINGS}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "List sibling links for a student" })
  @ApiOkResponse({ type: SiblingLinkDto, isArray: true })
  listSiblingLinks(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.listSiblingLinks(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Post(`:studentId/${API_ROUTES.SIBLINGS}`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({ summary: "Link a sibling to a student" })
  @ApiBody({ type: CreateSiblingLinkBodyDto })
  createSiblingLink(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateSiblingLinkBodyDto,
  ) {
    return this.studentsService.createSiblingLink(
      institution.id,
      studentId,
      authSession,
      scopes,
      parseCreateSiblingLink(body),
    );
  }

  @Delete(`:studentId/${API_ROUTES.SIBLINGS}/:linkId`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Remove a sibling link" })
  deleteSiblingLink(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @Param("linkId") linkId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.deleteSiblingLink(
      institution.id,
      studentId,
      linkId,
      authSession,
      scopes,
    );
  }

  // ── Medical Records ────────────────────────────────────────────────────────

  @Get(`:studentId/${API_ROUTES.MEDICAL}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "Get the medical record for a student" })
  @ApiOkResponse({ type: StudentMedicalRecordDto })
  getMedicalRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.getMedicalRecord(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Put(`:studentId/${API_ROUTES.MEDICAL}`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({
    summary: "Create or update the medical record for a student",
  })
  @ApiBody({ type: UpsertMedicalRecordBodyDto })
  @ApiOkResponse({ type: StudentMedicalRecordDto })
  upsertMedicalRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: UpsertMedicalRecordBodyDto,
  ) {
    return this.studentsService.upsertMedicalRecord(
      institution.id,
      studentId,
      authSession,
      scopes,
      parseUpsertMedicalRecord(body),
    );
  }

  // ── Disciplinary Records ───────────────────────────────────────────────────

  @Get(`:studentId/${API_ROUTES.DISCIPLINARY}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "List disciplinary records for a student" })
  @ApiOkResponse({ type: DisciplinaryRecordDto, isArray: true })
  listDisciplinaryRecords(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.listDisciplinaryRecords(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Post(`:studentId/${API_ROUTES.DISCIPLINARY}`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({ summary: "Record a disciplinary incident for a student" })
  @ApiBody({ type: CreateDisciplinaryRecordBodyDto })
  createDisciplinaryRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateDisciplinaryRecordBodyDto,
  ) {
    return this.studentsService.createDisciplinaryRecord(
      institution.id,
      studentId,
      authSession,
      scopes,
      parseCreateDisciplinaryRecord(body),
    );
  }

  // ── Transfer Certificates ──────────────────────────────────────────────────

  @Get(`:studentId/${API_ROUTES.TRANSFER_CERTIFICATE}`)
  @RequirePermission(PERMISSIONS.STUDENTS_READ)
  @ApiOperation({ summary: "List transfer certificates for a student" })
  @ApiOkResponse({ type: TransferCertificateDto, isArray: true })
  listTransferCertificates(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.studentsService.listTransferCertificates(
      institution.id,
      studentId,
      authSession,
      scopes,
    );
  }

  @Post(`:studentId/${API_ROUTES.TRANSFER_CERTIFICATE}`)
  @RequirePermission(PERMISSIONS.STUDENTS_MANAGE)
  @ApiOperation({
    summary:
      "Issue a transfer certificate for a student and deactivate enrollment",
  })
  @ApiBody({ type: IssueTransferCertificateBodyDto })
  issueTransferCertificate(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("studentId") studentId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: IssueTransferCertificateBodyDto,
  ) {
    return this.studentsService.issueTransferCertificate(
      institution.id,
      studentId,
      authSession,
      scopes,
      parseIssueTransferCertificate(body),
    );
  }
}
