import {
  Body,
  Controller,
  Get,
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
  ApiQuery,
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
  BatchReportCardsQueryParamsDto,
  ClassAnalysisDto,
  ClassAnalysisQueryParamsDto,
  CreateExamTermBodyDto,
  CreateGradingScaleBodyDto,
  ExamMarkDto,
  ExamReportCardDto,
  ExamReportCardQueryParamsDto,
  ExamTermDto,
  GradingScaleDto,
  RankedStudentDto,
  RanksDto,
  RanksQueryParamsDto,
  UpdateGradingScaleBodyDto,
  UpsertExamMarksBodyDto,
} from "./exams.dto";
import {
  parseBatchReportCardsQuery,
  parseClassAnalysisQuery,
  parseCreateExamTerm,
  parseCreateGradingScale,
  parseExamReportCardQuery,
  parseRanksQuery,
  parseUpdateGradingScale,
  parseUpsertExamMarks,
} from "./exams.schemas";
import { ExamsService } from "./exams.service";

const EXAM_TERMS_ROUTE = `${API_ROUTES.EXAMS}/${API_ROUTES.TERMS}`;
const GRADING_SCALES_ROUTE = `${API_ROUTES.EXAMS}/${API_ROUTES.GRADING_SCALES}`;

@ApiTags(API_DOCS.TAGS.EXAMS)
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller()
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  // ── Grading scales ────────────────────────────────────────────────────

  @Get(GRADING_SCALES_ROUTE)
  @RequirePermission(PERMISSIONS.EXAMS_MANAGE)
  @ApiOperation({ summary: "List grading scales for the institution" })
  @ApiOkResponse({ type: GradingScaleDto, isArray: true })
  listGradingScales(@CurrentInstitution() institution: TenantInstitution) {
    return this.examsService.listGradingScales(institution.id);
  }

  @Post(GRADING_SCALES_ROUTE)
  @RequirePermission(PERMISSIONS.EXAMS_MANAGE)
  @ApiOperation({ summary: "Create a grading scale" })
  @ApiBody({ type: CreateGradingScaleBodyDto })
  @ApiOkResponse({ type: GradingScaleDto })
  createGradingScale(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateGradingScaleBodyDto,
  ) {
    return this.examsService.createGradingScale(
      institution.id,
      authSession,
      parseCreateGradingScale(body),
    );
  }

  @Patch(`${GRADING_SCALES_ROUTE}/:scaleId`)
  @RequirePermission(PERMISSIONS.EXAMS_MANAGE)
  @ApiOperation({ summary: "Update a grading scale" })
  @ApiBody({ type: UpdateGradingScaleBodyDto })
  @ApiOkResponse({ type: GradingScaleDto })
  updateGradingScale(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("scaleId") scaleId: string,
    @Body() body: UpdateGradingScaleBodyDto,
  ) {
    return this.examsService.updateGradingScale(
      institution.id,
      scaleId,
      authSession,
      parseUpdateGradingScale(body),
    );
  }

  @Patch(`${GRADING_SCALES_ROUTE}/:scaleId/${API_ROUTES.DEFAULT}`)
  @RequirePermission(PERMISSIONS.EXAMS_MANAGE)
  @ApiOperation({ summary: "Set a grading scale as the institution default" })
  @ApiOkResponse({ type: GradingScaleDto })
  setDefaultGradingScale(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Param("scaleId") scaleId: string,
  ) {
    return this.examsService.setDefaultGradingScale(
      institution.id,
      scaleId,
      authSession,
    );
  }

  // ── Exam terms ────────────────────────────────────────────────────────

  @Get(EXAM_TERMS_ROUTE)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({ summary: "List exam terms for the current tenant" })
  @ApiOkResponse({ type: ExamTermDto, isArray: true })
  listExamTerms(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.examsService.listExamTerms(institution.id, authSession);
  }

  @Post(EXAM_TERMS_ROUTE)
  @RequirePermission(PERMISSIONS.EXAMS_MANAGE)
  @ApiOperation({ summary: "Create an exam term" })
  @ApiBody({ type: CreateExamTermBodyDto })
  @ApiOkResponse({ type: ExamTermDto })
  createExamTerm(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateExamTermBodyDto,
  ) {
    return this.examsService.createExamTerm(
      institution.id,
      authSession,
      parseCreateExamTerm(body),
    );
  }

  // ── Marks ─────────────────────────────────────────────────────────────

  @Get(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.MARKS}`)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({ summary: "List marks for an exam term" })
  @ApiOkResponse({ type: ExamMarkDto, isArray: true })
  listExamMarks(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.examsService.listExamMarks(
      institution.id,
      examTermId,
      authSession,
      scopes,
    );
  }

  @Put(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.MARKS}`)
  @RequirePermission(PERMISSIONS.MARKS_WRITE)
  @ApiOperation({ summary: "Replace the marks list for an exam term" })
  @ApiBody({ type: UpsertExamMarksBodyDto })
  @ApiOkResponse({ type: ExamMarkDto, isArray: true })
  replaceExamMarks(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpsertExamMarksBodyDto,
  ) {
    return this.examsService.replaceExamMarks(
      institution.id,
      examTermId,
      authSession,
      parseUpsertExamMarks(body),
    );
  }

  // ── Report card ───────────────────────────────────────────────────────

  @Get(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.REPORT_CARD}`)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({
    summary: "Get subject-wise report card with grading for one student",
  })
  @ApiQuery({ name: "studentId", type: String })
  @ApiOkResponse({ type: ExamReportCardDto })
  getExamReportCard(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ExamReportCardQueryParamsDto,
  ) {
    return this.examsService.getExamReportCard(
      institution.id,
      examTermId,
      parseExamReportCardQuery(query),
      scopes,
    );
  }

  // ── Ranks ─────────────────────────────────────────────────────────────

  @Get(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.RANKS}`)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({ summary: "Get ranked student list for a class/section" })
  @ApiQuery({ name: "classId", type: String })
  @ApiQuery({ name: "sectionId", type: String, required: false })
  @ApiOkResponse({ type: RanksDto })
  getRanks(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @Query() query: RanksQueryParamsDto,
  ) {
    return this.examsService.getRanks(
      institution.id,
      examTermId,
      parseRanksQuery(query),
    );
  }

  // ── Class analysis ────────────────────────────────────────────────────

  @Get(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.CLASS_ANALYSIS}`)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({
    summary: "Get class-level marks analysis for an exam term",
  })
  @ApiQuery({ name: "classId", type: String })
  @ApiQuery({ name: "sectionId", type: String, required: false })
  @ApiOkResponse({ type: ClassAnalysisDto })
  getClassAnalysis(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @Query() query: ClassAnalysisQueryParamsDto,
  ) {
    return this.examsService.getClassAnalysis(
      institution.id,
      examTermId,
      parseClassAnalysisQuery(query),
    );
  }

  // ── Batch report cards ────────────────────────────────────────────────

  @Get(`${EXAM_TERMS_ROUTE}/:examTermId/${API_ROUTES.BATCH_REPORT_CARDS}`)
  @RequirePermission(PERMISSIONS.EXAMS_READ)
  @ApiOperation({
    summary: "Get report cards for all students in a class/section",
  })
  @ApiQuery({ name: "classId", type: String })
  @ApiQuery({ name: "sectionId", type: String, required: false })
  @ApiOkResponse({ type: ExamReportCardDto, isArray: true })
  getBatchReportCards(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: BatchReportCardsQueryParamsDto,
  ) {
    return this.examsService.getBatchReportCards(
      institution.id,
      examTermId,
      parseBatchReportCardsQuery(query),
      scopes,
    );
  }
}
