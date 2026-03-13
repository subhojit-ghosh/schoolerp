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
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES } from "../../constants";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import {
  CreateExamTermBodyDto,
  ExamMarkDto,
  ExamTermDto,
  UpsertExamMarksBodyDto,
} from "./exams.dto";
import { parseCreateExamTerm, parseUpsertExamMarks } from "./exams.schemas";
import { ExamsService } from "./exams.service";

const EXAM_TERMS_ROUTE = `${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.EXAMS}/${API_ROUTES.TERMS}`;

@ApiTags(API_DOCS.TAGS.EXAMS)
@Controller(EXAM_TERMS_ROUTE)
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  @ApiCookieAuth()
  @ApiOperation({ summary: "List exam terms for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: ExamTermDto, isArray: true })
  listExamTerms(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.examsService.listExamTerms(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post()
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create an exam term for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateExamTermBodyDto })
  @ApiOkResponse({ type: ExamTermDto })
  createExamTerm(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateExamTermBodyDto,
  ) {
    return this.examsService.createExamTerm(
      institutionId,
      authSession,
      parseCreateExamTerm(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(`:examTermId/${API_ROUTES.MARKS}`)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List marks for an exam term" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "examTermId", type: String })
  @ApiOkResponse({ type: ExamMarkDto, isArray: true })
  listExamMarks(
    @Param("institutionId") institutionId: string,
    @Param("examTermId") examTermId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.examsService.listExamMarks(
      institutionId,
      examTermId,
      authSession,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Put(`:examTermId/${API_ROUTES.MARKS}`)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Replace the marks list for an exam term" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiParam({ name: "examTermId", type: String })
  @ApiBody({ type: UpsertExamMarksBodyDto })
  @ApiOkResponse({ type: ExamMarkDto, isArray: true })
  replaceExamMarks(
    @Param("institutionId") institutionId: string,
    @Param("examTermId") examTermId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: UpsertExamMarksBodyDto,
  ) {
    return this.examsService.replaceExamMarks(
      institutionId,
      examTermId,
      authSession,
      parseUpsertExamMarks(body),
    );
  }
}
