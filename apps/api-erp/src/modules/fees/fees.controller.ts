import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
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
  CreateFeeAssignmentBodyDto,
  CreateFeePaymentBodyDto,
  CreateFeeStructureBodyDto,
  FeeAssignmentDto,
  FeePaymentDto,
  FeeStructureDto,
} from "./fees.dto";
import {
  parseCreateFeeAssignment,
  parseCreateFeePayment,
  parseCreateFeeStructure,
} from "./fees.schemas";
import { FeesService } from "./fees.service";

@ApiTags(API_DOCS.TAGS.FEES)
@Controller(`${API_ROUTES.INSTITUTIONS}/:institutionId/${API_ROUTES.FEES}`)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.STRUCTURES)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List fee structures for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: FeeStructureDto, isArray: true })
  listFeeStructures(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.feesService.listFeeStructures(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post(API_ROUTES.STRUCTURES)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Create a fee structure for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateFeeStructureBodyDto })
  @ApiCreatedResponse({ type: FeeStructureDto })
  createFeeStructure(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeeStructureBodyDto,
  ) {
    return this.feesService.createFeeStructure(
      institutionId,
      authSession,
      parseCreateFeeStructure(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.ASSIGNMENTS)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List fee assignments for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: FeeAssignmentDto, isArray: true })
  listFeeAssignments(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.feesService.listFeeAssignments(institutionId, authSession);
  }

  @UseGuards(SessionAuthGuard)
  @Post(API_ROUTES.ASSIGNMENTS)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Assign a fee structure to a student" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateFeeAssignmentBodyDto })
  @ApiCreatedResponse({ type: FeeAssignmentDto })
  createFeeAssignment(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeeAssignmentBodyDto,
  ) {
    return this.feesService.createFeeAssignment(
      institutionId,
      authSession,
      parseCreateFeeAssignment(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post(API_ROUTES.PAYMENTS)
  @ApiCookieAuth()
  @ApiOperation({ summary: "Record a fee payment for an assignment" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiBody({ type: CreateFeePaymentBodyDto })
  @ApiCreatedResponse({ type: FeePaymentDto })
  createFeePayment(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeePaymentBodyDto,
  ) {
    return this.feesService.createFeePayment(
      institutionId,
      authSession,
      parseCreateFeePayment(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get(API_ROUTES.DUES)
  @ApiCookieAuth()
  @ApiOperation({ summary: "List outstanding fee dues for an institution" })
  @ApiParam({ name: "institutionId", type: String })
  @ApiOkResponse({ type: FeeAssignmentDto, isArray: true })
  listFeeDues(
    @Param("institutionId") institutionId: string,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.feesService.listFeeDues(institutionId, authSession);
  }
}
