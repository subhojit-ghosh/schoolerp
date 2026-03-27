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
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
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
  BulkFeeAssignmentBodyDto,
  BulkFeeAssignmentResultDto,
  CollectionSummaryDto,
  CollectionSummaryQueryDto,
  CreateFeeAssignmentBodyDto,
  CreateFeeAssignmentResultDto,
  CreateFeeAdjustmentBodyDto,
  CreateFeePaymentBodyDto,
  CreateFeeStructureBodyDto,
  FeeAssignmentDetailDto,
  FeeAssignmentDto,
  FeeAdjustmentDto,
  FeePaymentDto,
  FeeStructureDetailDto,
  FeeStructureDto,
  ListFeeAssignmentsQueryDto,
  ListFeeDuesQueryDto,
  ListFeeStructuresQueryDto,
  PaginatedFeeAssignmentDto,
  PaginatedFeeStructureDto,
  ReverseFeePaymentBodyDto,
  SetFeeStructureStatusBodyDto,
  UpdateFeeAssignmentBodyDto,
  UpdateFeeStructureBodyDto,
} from "./fees.dto";
import {
  parseBulkFeeAssignment,
  parseCollectionSummaryQuery,
  parseCreateFeeAssignment,
  parseCreateFeeAdjustment,
  parseCreateFeePayment,
  parseCreateFeeStructure,
  parseListFeeAssignmentsQuery,
  parseListFeeDuesQuery,
  parseListFeeStructuresQuery,
  parseReverseFeePayment,
  parseSetFeeStructureStatus,
  parseUpdateFeeAssignment,
  parseUpdateFeeStructure,
} from "./fees.schemas";
import { FeesService } from "./fees.service";

const STRUCTURE_DETAIL_PATH = `${API_ROUTES.STRUCTURES}/:feeStructureId`;
const STRUCTURE_STATUS_PATH = `${STRUCTURE_DETAIL_PATH}/${API_ROUTES.STATUS}`;
const STRUCTURE_DUPLICATE_PATH = `${API_ROUTES.STRUCTURES}/:feeStructureId/${API_ROUTES.DUPLICATE}`;
const STRUCTURE_CREATE_NEXT_VERSION_PATH = `${API_ROUTES.STRUCTURES}/:feeStructureId/${API_ROUTES.CREATE_NEXT_VERSION}`;
const ASSIGNMENT_DETAIL_PATH = `${API_ROUTES.ASSIGNMENTS}/:feeAssignmentId`;
const ASSIGNMENT_ADJUSTMENTS_PATH = `${ASSIGNMENT_DETAIL_PATH}/${API_ROUTES.ADJUSTMENTS}`;
const ASSIGNMENT_REMIND_PATH = `${ASSIGNMENT_DETAIL_PATH}/${API_ROUTES.REMIND}`;
const BULK_ASSIGNMENTS_PATH = `${API_ROUTES.ASSIGNMENTS}/${API_ROUTES.BULK}`;
const PAYMENT_REVERSE_PATH = `${API_ROUTES.PAYMENTS}/:feePaymentId/${API_ROUTES.REVERSE}`;
const COLLECTION_SUMMARY_PATH = `${API_ROUTES.REPORTS}/${API_ROUTES.COLLECTION_SUMMARY}`;

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

  // ── Fee Structures ────────────────────────────────────────────────────────

  @Get(API_ROUTES.STRUCTURES)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "List fee structures for the current tenant" })
  @ApiOkResponse({ type: PaginatedFeeStructureDto })
  listFeeStructures(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListFeeStructuresQueryDto,
  ) {
    return this.feesService.listFeeStructures(
      institution.id,
      authSession,
      scopes,
      parseListFeeStructuresQuery(query),
    );
  }

  @Get(STRUCTURE_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "Get a fee structure with collection summary" })
  @ApiOkResponse({ type: FeeStructureDetailDto })
  getFeeStructure(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
  ) {
    return this.feesService.getFeeStructure(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
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
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateFeeStructureBodyDto,
  ) {
    return this.feesService.createFeeStructure(
      institution.id,
      authSession,
      scopes,
      parseCreateFeeStructure(body),
    );
  }

  @Post(STRUCTURE_DUPLICATE_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Duplicate a fee structure" })
  @ApiCreatedResponse({ type: FeeStructureDetailDto })
  duplicateFeeStructure(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
  ) {
    return this.feesService.duplicateFeeStructure(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
    );
  }

  @Post(STRUCTURE_CREATE_NEXT_VERSION_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Create the next version of a fee structure" })
  @ApiCreatedResponse({ type: FeeStructureDetailDto })
  createNextFeeStructureVersion(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
  ) {
    return this.feesService.createNextFeeStructureVersion(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
    );
  }

  @Patch(STRUCTURE_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Update a fee structure" })
  @ApiBody({ type: UpdateFeeStructureBodyDto })
  @ApiOkResponse({ type: FeeStructureDto })
  updateFeeStructure(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
    @Body() body: UpdateFeeStructureBodyDto,
  ) {
    return this.feesService.updateFeeStructure(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
      parseUpdateFeeStructure(body),
    );
  }

  @Patch(STRUCTURE_STATUS_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Set a fee structure status" })
  @ApiBody({ type: SetFeeStructureStatusBodyDto })
  @ApiOkResponse({ type: FeeStructureDto })
  setFeeStructureStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
    @Body() body: SetFeeStructureStatusBodyDto,
  ) {
    return this.feesService.setFeeStructureStatus(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
      parseSetFeeStructureStatus(body),
    );
  }

  @Delete(STRUCTURE_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a fee structure (only if no assignments exist)",
  })
  @ApiNoContentResponse()
  async deleteFeeStructure(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeStructureId") feeStructureId: string,
  ) {
    await this.feesService.deleteFeeStructure(
      institution.id,
      authSession,
      scopes,
      feeStructureId,
    );
  }

  // ── Fee Assignments ───────────────────────────────────────────────────────

  @Get(API_ROUTES.ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "List fee assignments for the current tenant" })
  @ApiOkResponse({ type: PaginatedFeeAssignmentDto })
  listFeeAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListFeeAssignmentsQueryDto,
  ) {
    return this.feesService.listFeeAssignments(
      institution.id,
      authSession,
      scopes,
      parseListFeeAssignmentsQuery(query),
    );
  }

  @Get(ASSIGNMENT_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "Get a fee assignment with payment history" })
  @ApiOkResponse({ type: FeeAssignmentDetailDto })
  getFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeAssignmentId") feeAssignmentId: string,
  ) {
    return this.feesService.getFeeAssignment(
      institution.id,
      authSession,
      scopes,
      feeAssignmentId,
    );
  }

  @Post(API_ROUTES.ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Assign a fee structure to a student" })
  @ApiBody({ type: CreateFeeAssignmentBodyDto })
  @ApiCreatedResponse({ type: CreateFeeAssignmentResultDto })
  createFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateFeeAssignmentBodyDto,
  ) {
    return this.feesService.createFeeAssignment(
      institution.id,
      authSession,
      scopes,
      parseCreateFeeAssignment(body),
    );
  }

  @Post(ASSIGNMENT_ADJUSTMENTS_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Apply a concession or waiver to a fee assignment" })
  @ApiBody({ type: CreateFeeAdjustmentBodyDto })
  @ApiCreatedResponse({ type: FeeAdjustmentDto })
  createFeeAdjustment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeAssignmentId") feeAssignmentId: string,
    @Body() body: CreateFeeAdjustmentBodyDto,
  ) {
    return this.feesService.createFeeAdjustment(
      institution.id,
      authSession,
      scopes,
      feeAssignmentId,
      parseCreateFeeAdjustment({
        ...body,
        feeAssignmentId,
      }),
    );
  }

  @Post(BULK_ASSIGNMENTS_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({
    summary: "Bulk-assign a fee structure to all students in a class",
  })
  @ApiBody({ type: BulkFeeAssignmentBodyDto })
  @ApiCreatedResponse({ type: BulkFeeAssignmentResultDto })
  createBulkFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: BulkFeeAssignmentBodyDto,
  ) {
    return this.feesService.createBulkFeeAssignment(
      institution.id,
      authSession,
      scopes,
      parseBulkFeeAssignment(body),
    );
  }

  @Patch(ASSIGNMENT_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Update a fee assignment" })
  @ApiBody({ type: UpdateFeeAssignmentBodyDto })
  @ApiOkResponse({ type: FeeAssignmentDto })
  updateFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeAssignmentId") feeAssignmentId: string,
    @Body() body: UpdateFeeAssignmentBodyDto,
  ) {
    return this.feesService.updateFeeAssignment(
      institution.id,
      authSession,
      scopes,
      feeAssignmentId,
      parseUpdateFeeAssignment(body),
    );
  }

  @Delete(ASSIGNMENT_DETAIL_PATH)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: "Delete a fee assignment (only if no payments recorded)",
  })
  @ApiNoContentResponse()
  async deleteFeeAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeAssignmentId") feeAssignmentId: string,
  ) {
    await this.feesService.deleteFeeAssignment(
      institution.id,
      authSession,
      scopes,
      feeAssignmentId,
    );
  }

  // ── Fee Payments ──────────────────────────────────────────────────────────

  @Post(API_ROUTES.PAYMENTS)
  @RequirePermission(PERMISSIONS.FEES_COLLECT)
  @ApiOperation({ summary: "Record a fee payment for an assignment" })
  @ApiBody({ type: CreateFeePaymentBodyDto })
  @ApiCreatedResponse({ type: FeePaymentDto })
  createFeePayment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Body() body: CreateFeePaymentBodyDto,
  ) {
    return this.feesService.createFeePayment(
      institution.id,
      authSession,
      scopes,
      parseCreateFeePayment(body),
    );
  }

  @Post(PAYMENT_REVERSE_PATH)
  @RequirePermission(PERMISSIONS.FEES_COLLECT)
  @ApiOperation({ summary: "Reverse a recorded fee payment" })
  @ApiBody({ type: ReverseFeePaymentBodyDto })
  @ApiCreatedResponse({ type: FeePaymentDto })
  reverseFeePayment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feePaymentId") feePaymentId: string,
    @Body() body: ReverseFeePaymentBodyDto,
  ) {
    return this.feesService.reverseFeePayment(
      institution.id,
      authSession,
      scopes,
      feePaymentId,
      parseReverseFeePayment(body),
    );
  }

  @Post(ASSIGNMENT_REMIND_PATH)
  @HttpCode(HttpStatus.OK)
  @RequirePermission(PERMISSIONS.FEES_MANAGE)
  @ApiOperation({ summary: "Manually send a fee reminder to the guardian" })
  @ApiOkResponse({
    schema: { properties: { sentAt: { type: "string" }, recipientCount: { type: "number" } } },
  })
  sendFeeReminder(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Param("feeAssignmentId") feeAssignmentId: string,
  ) {
    return this.feesService.sendFeeReminder(
      institution.id,
      authSession,
      scopes,
      feeAssignmentId,
    );
  }

  // ── Dues ──────────────────────────────────────────────────────────────────

  @Get(API_ROUTES.DUES)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "List outstanding fee dues for the current tenant" })
  @ApiOkResponse({ type: PaginatedFeeAssignmentDto })
  listFeeDues(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: ListFeeDuesQueryDto,
  ) {
    return this.feesService.listFeeDues(
      institution.id,
      authSession,
      scopes,
      parseListFeeDuesQuery(query),
    );
  }

  // ── Reports ───────────────────────────────────────────────────────────────

  @Get(COLLECTION_SUMMARY_PATH)
  @RequirePermission(PERMISSIONS.FEES_READ)
  @ApiOperation({ summary: "Get fee collection summary grouped by structure" })
  @ApiOkResponse({ type: CollectionSummaryDto })
  getCollectionSummary(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() authSession: AuthenticatedSession,
    @CurrentScopes() scopes: ResolvedScopes,
    @Query() query: CollectionSummaryQueryDto,
  ) {
    return this.feesService.getCollectionSummary(
      institution.id,
      authSession,
      scopes,
      parseCollectionSummaryQuery(query),
    );
  }
}
