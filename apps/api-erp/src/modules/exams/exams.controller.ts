import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
  CreateExamTermBodyDto,
  ExamMarkDto,
  ExamTermDto,
  UpsertExamMarksBodyDto,
} from "./exams.dto";
import { parseCreateExamTerm, parseUpsertExamMarks } from "./exams.schemas";
import { ExamsService } from "./exams.service";

const EXAM_TERMS_ROUTE = `${API_ROUTES.EXAMS}/${API_ROUTES.TERMS}`;

@ApiTags(API_DOCS.TAGS.EXAMS)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard)
@Controller(EXAM_TERMS_ROUTE)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  @ApiOperation({
    summary: "List exam terms for the current tenant institution",
  })
  @ApiOkResponse({ type: ExamTermDto, isArray: true })
  listExamTerms(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.examsService.listExamTerms(institution.id, authSession);
  }

  @Post()
  @ApiOperation({ summary: "Create an exam term for the current tenant" })
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

  @Get(`:examTermId/${API_ROUTES.MARKS}`)
  @ApiOperation({ summary: "List marks for an exam term" })
  @ApiOkResponse({ type: ExamMarkDto, isArray: true })
  listExamMarks(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("examTermId") examTermId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.examsService.listExamMarks(
      institution.id,
      examTermId,
      authSession,
    );
  }

  @Put(`:examTermId/${API_ROUTES.MARKS}`)
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
}
