import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { API_DOCS, API_ROUTES, PERMISSIONS } from "../../constants";
import { PermissionGuard } from "../auth/permission.guard";
import { RequirePermission } from "../auth/require-permission.decorator";
import { CurrentSession } from "../auth/current-session.decorator";
import type { AuthenticatedSession } from "../auth/auth.types";
import { SessionAuthGuard } from "../auth/session-auth.guard";
import { CurrentInstitution } from "../tenant-context/current-institution.decorator";
import { TenantInstitutionGuard } from "../tenant-context/tenant-institution.guard";
import type { TenantInstitution } from "../tenant-context/tenant-context.types";
import {
  CreateRecordBodyDto,
  UpdateRecordBodyDto,
  IncomeRecordDto,
  IncomeRecordDetailDto,
  IncomeRecordListResultDto,
  ListRecordsQueryParamsDto,
  IncomeSummaryQueryParamsDto,
  IncomeSummaryDto,
} from "./income.dto";
import {
  parseCreateRecord,
  parseUpdateRecord,
  parseListRecords,
  parseIncomeSummaryQuery,
} from "./income.schemas";
import { IncomeService } from "./income.service";

@ApiTags(API_DOCS.TAGS.INCOME)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.INCOME)
export class IncomeController {
  constructor(private readonly incomeService: IncomeService) {}

  // ── Records ─────────────────────────────────────────────────────────────

  @Get(API_ROUTES.INCOME_RECORDS)
  @RequirePermission(PERMISSIONS.INCOME_READ)
  @ApiOperation({ summary: "List income records" })
  @ApiOkResponse({ type: IncomeRecordListResultDto })
  async listRecords(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListRecordsQueryParamsDto,
  ) {
    const parsed = parseListRecords(query);
    return this.incomeService.listRecords(institution.id, parsed);
  }

  @Post(API_ROUTES.INCOME_RECORDS)
  @RequirePermission(PERMISSIONS.INCOME_MANAGE)
  @ApiOperation({ summary: "Create an income record" })
  @ApiCreatedResponse({ type: IncomeRecordDto })
  async createRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateRecordBodyDto,
  ) {
    const dto = parseCreateRecord(body);
    return this.incomeService.createRecord(institution.id, session, dto);
  }

  @Get(`${API_ROUTES.INCOME_RECORDS}/:recordId`)
  @RequirePermission(PERMISSIONS.INCOME_READ)
  @ApiOperation({ summary: "Get income record detail" })
  @ApiOkResponse({ type: IncomeRecordDetailDto })
  async getRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("recordId") recordId: string,
  ) {
    return this.incomeService.getRecord(institution.id, recordId);
  }

  @Patch(`${API_ROUTES.INCOME_RECORDS}/:recordId`)
  @RequirePermission(PERMISSIONS.INCOME_MANAGE)
  @ApiOperation({ summary: "Update an income record" })
  @ApiOkResponse({ type: IncomeRecordDto })
  async updateRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("recordId") recordId: string,
    @Body() body: UpdateRecordBodyDto,
  ) {
    const dto = parseUpdateRecord(body);
    return this.incomeService.updateRecord(
      institution.id,
      recordId,
      session,
      dto,
    );
  }

  @Delete(`${API_ROUTES.INCOME_RECORDS}/:recordId`)
  @RequirePermission(PERMISSIONS.INCOME_MANAGE)
  @ApiOperation({ summary: "Delete an income record" })
  @ApiOkResponse()
  async deleteRecord(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("recordId") recordId: string,
  ) {
    return this.incomeService.deleteRecord(institution.id, recordId, session);
  }

  // ── Summary ─────────────────────────────────────────────────────────────

  @Get(API_ROUTES.INCOME_SUMMARY)
  @RequirePermission(PERMISSIONS.INCOME_READ)
  @ApiOperation({ summary: "Get income summary report" })
  @ApiOkResponse({ type: IncomeSummaryDto })
  async getSummary(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: IncomeSummaryQueryParamsDto,
  ) {
    const parsed = parseIncomeSummaryQuery(query);
    return this.incomeService.getSummary(institution.id, parsed);
  }
}
