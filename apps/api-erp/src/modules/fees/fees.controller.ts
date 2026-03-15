import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
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
@ApiCookieAuth()
@UseGuards(
  SessionAuthGuard,
  TenantInstitutionGuard,
  PermissionGuard,
  ScopeGuard,
)
@Controller(API_ROUTES.FEES)
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get(API_ROUTES.STRUCTURES)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({
    summary: "List fee structures for the current tenant institution",
  })
  @ApiOkResponse({ type: FeeStructureDto, isArray: true })
  listFeeStructures(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
  ) {
    return this.feesService.listFeeStructures(
      institution.id,
      authSession,
      scopes,
    );
  }

  @Post(API_ROUTES.STRUCTURES)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Create a fee structure for the current tenant" })
  @ApiBody({ type: CreateFeeStructureBodyDto })
  @ApiCreatedResponse({ type: FeeStructureDto })
  createFeeStructure(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeeStructureBodyDto,
  ) {
    return this.feesService.createFeeStructure(
      institution.id,
      authSession,
      parseCreateFeeStructure(body),
    );
  }

  @Get(API_ROUTES.ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({
    summary: "List fee assignments for the current tenant institution",
  })
  @ApiOkResponse({ type: FeeAssignmentDto, isArray: true })
  listFeeAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.feesService.listFeeAssignments(institution.id, authSession);
  }

  @Post(API_ROUTES.ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Assign a fee structure to a student" })
  @ApiBody({ type: CreateFeeAssignmentBodyDto })
  @ApiCreatedResponse({ type: FeeAssignmentDto })
  createFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeeAssignmentBodyDto,
  ) {
    return this.feesService.createFeeAssignment(
      institution.id,
      authSession,
      parseCreateFeeAssignment(body),
    );
  }

  @Post(API_ROUTES.PAYMENTS)
  @RequirePermission(PERMISSIONS.FEES_COLLECT)
  @ApiOperation({ summary: "Record a fee payment for an assignment" })
  @ApiBody({ type: CreateFeePaymentBodyDto })
  @ApiCreatedResponse({ type: FeePaymentDto })
  createFeePayment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @Body() body: CreateFeePaymentBodyDto,
  ) {
    return this.feesService.createFeePayment(
      institution.id,
      authSession,
      parseCreateFeePayment(body),
    );
  }

  @Get(API_ROUTES.DUES)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "List outstanding fee dues for the current tenant" })
  @ApiOkResponse({ type: FeeAssignmentDto, isArray: true })
  listFeeDues(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
  ) {
    return this.feesService.listFeeDues(institution.id, authSession);
  }
}
