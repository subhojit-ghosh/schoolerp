import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import type { Response } from "express";
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
  IdResponseDto,
  CreateSalaryComponentBodyDto,
  UpdateSalaryComponentBodyDto,
  UpdateSalaryComponentStatusBodyDto,
  SalaryComponentListResultDto,
  CreateSalaryTemplateBodyDto,
  UpdateSalaryTemplateBodyDto,
  UpdateSalaryTemplateStatusBodyDto,
  SalaryTemplateDetailDto,
  SalaryTemplateListResultDto,
  CreateSalaryAssignmentBodyDto,
  UpdateSalaryAssignmentBodyDto,
  UpdateSalaryAssignmentStatusBodyDto,
  SalaryAssignmentDto,
  SalaryAssignmentListResultDto,
  CreatePayrollRunBodyDto,
  PayrollRunDto,
  PayrollRunListResultDto,
  PayslipDetailDto,
  PayslipListResultDto,
  ListSalaryComponentsQueryParamsDto,
  ListSalaryTemplatesQueryParamsDto,
  ListSalaryAssignmentsQueryParamsDto,
  ListPayrollRunsQueryParamsDto,
  ListPayslipsQueryParamsDto,
  MonthlySummaryQueryParamsDto,
  MonthlySummaryResponseDto,
  StaffHistoryQueryParamsDto,
  StaffHistoryResponseDto,
} from "./payroll.dto";
import {
  parseCreateSalaryComponent,
  parseUpdateSalaryComponent,
  parseUpdateSalaryComponentStatus,
  parseListSalaryComponents,
  parseCreateSalaryTemplate,
  parseUpdateSalaryTemplate,
  parseUpdateSalaryTemplateStatus,
  parseListSalaryTemplates,
  parseCreateSalaryAssignment,
  parseUpdateSalaryAssignment,
  parseUpdateSalaryAssignmentStatus,
  parseListSalaryAssignments,
  parseCreatePayrollRun,
  parseListPayrollRuns,
  parseListPayslips,
  parseMonthlySummary,
  parseStaffHistory,
} from "./payroll.schemas";
import { PayrollService } from "./payroll.service";

@ApiTags(API_DOCS.TAGS.PAYROLL)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.PAYROLL)
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ── Salary Components ───────────────────────────────────────────────────

  @Get(API_ROUTES.SALARY_COMPONENTS)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "List salary components" })
  @ApiOkResponse({ type: SalaryComponentListResultDto })
  async listSalaryComponents(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListSalaryComponentsQueryParamsDto,
  ) {
    const parsed = parseListSalaryComponents(query);
    return this.payrollService.listSalaryComponents(institution.id, parsed);
  }

  @Post(API_ROUTES.SALARY_COMPONENTS)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Create a salary component" })
  @ApiCreatedResponse({ type: IdResponseDto })
  async createSalaryComponent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateSalaryComponentBodyDto,
  ) {
    const dto = parseCreateSalaryComponent(body);
    return this.payrollService.createSalaryComponent(
      institution.id,
      session,
      dto,
    );
  }

  @Patch(`${API_ROUTES.SALARY_COMPONENTS}/:componentId`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update a salary component" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryComponent(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("componentId") componentId: string,
    @Body() body: UpdateSalaryComponentBodyDto,
  ) {
    const dto = parseUpdateSalaryComponent(body);
    return this.payrollService.updateSalaryComponent(
      institution.id,
      componentId,
      session,
      dto,
    );
  }

  @Patch(`${API_ROUTES.SALARY_COMPONENTS}/:componentId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update salary component status" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryComponentStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("componentId") componentId: string,
    @Body() body: UpdateSalaryComponentStatusBodyDto,
  ) {
    const dto = parseUpdateSalaryComponentStatus(body);
    return this.payrollService.updateSalaryComponentStatus(
      institution.id,
      componentId,
      session,
      dto,
    );
  }

  // ── Salary Templates ────────────────────────────────────────────────────

  @Get(API_ROUTES.SALARY_TEMPLATES)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "List salary templates" })
  @ApiOkResponse({ type: SalaryTemplateListResultDto })
  async listSalaryTemplates(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListSalaryTemplatesQueryParamsDto,
  ) {
    const parsed = parseListSalaryTemplates(query);
    return this.payrollService.listSalaryTemplates(institution.id, parsed);
  }

  @Post(API_ROUTES.SALARY_TEMPLATES)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Create a salary template with components" })
  @ApiCreatedResponse({ type: IdResponseDto })
  async createSalaryTemplate(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateSalaryTemplateBodyDto,
  ) {
    const dto = parseCreateSalaryTemplate(body);
    return this.payrollService.createSalaryTemplate(
      institution.id,
      session,
      dto,
    );
  }

  @Get(`${API_ROUTES.SALARY_TEMPLATES}/:templateId`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Get salary template detail with components" })
  @ApiOkResponse({ type: SalaryTemplateDetailDto })
  async getSalaryTemplate(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("templateId") templateId: string,
  ) {
    return this.payrollService.getSalaryTemplate(institution.id, templateId);
  }

  @Patch(`${API_ROUTES.SALARY_TEMPLATES}/:templateId`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update a salary template" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryTemplate(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("templateId") templateId: string,
    @Body() body: UpdateSalaryTemplateBodyDto,
  ) {
    const dto = parseUpdateSalaryTemplate(body);
    return this.payrollService.updateSalaryTemplate(
      institution.id,
      templateId,
      session,
      dto,
    );
  }

  @Patch(`${API_ROUTES.SALARY_TEMPLATES}/:templateId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update salary template status" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryTemplateStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("templateId") templateId: string,
    @Body() body: UpdateSalaryTemplateStatusBodyDto,
  ) {
    const dto = parseUpdateSalaryTemplateStatus(body);
    return this.payrollService.updateSalaryTemplateStatus(
      institution.id,
      templateId,
      session,
      dto,
    );
  }

  // ── Salary Assignments ──────────────────────────────────────────────────

  @Get(API_ROUTES.SALARY_ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "List salary assignments" })
  @ApiOkResponse({ type: SalaryAssignmentListResultDto })
  async listSalaryAssignments(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListSalaryAssignmentsQueryParamsDto,
  ) {
    const parsed = parseListSalaryAssignments(query);
    return this.payrollService.listSalaryAssignments(institution.id, parsed);
  }

  @Post(API_ROUTES.SALARY_ASSIGNMENTS)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Assign salary template to a staff member" })
  @ApiCreatedResponse({ type: IdResponseDto })
  async createSalaryAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateSalaryAssignmentBodyDto,
  ) {
    const dto = parseCreateSalaryAssignment(body);
    return this.payrollService.createSalaryAssignment(
      institution.id,
      session,
      dto,
    );
  }

  @Get(`${API_ROUTES.SALARY_ASSIGNMENTS}/:assignmentId`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Get salary assignment detail" })
  @ApiOkResponse({ type: SalaryAssignmentDto })
  async getSalaryAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("assignmentId") assignmentId: string,
  ) {
    return this.payrollService.getSalaryAssignment(
      institution.id,
      assignmentId,
    );
  }

  @Patch(`${API_ROUTES.SALARY_ASSIGNMENTS}/:assignmentId`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update salary assignment" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryAssignment(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("assignmentId") assignmentId: string,
    @Body() body: UpdateSalaryAssignmentBodyDto,
  ) {
    const dto = parseUpdateSalaryAssignment(body);
    return this.payrollService.updateSalaryAssignment(
      institution.id,
      assignmentId,
      session,
      dto,
    );
  }

  @Patch(`${API_ROUTES.SALARY_ASSIGNMENTS}/:assignmentId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Update salary assignment status" })
  @ApiOkResponse({ type: IdResponseDto })
  async updateSalaryAssignmentStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("assignmentId") assignmentId: string,
    @Body() body: UpdateSalaryAssignmentStatusBodyDto,
  ) {
    const dto = parseUpdateSalaryAssignmentStatus(body);
    return this.payrollService.updateSalaryAssignmentStatus(
      institution.id,
      assignmentId,
      session,
      dto,
    );
  }

  // ── Payroll Runs ────────────────────────────────────────────────────────

  @Get(API_ROUTES.PAYROLL_RUNS)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "List payroll runs" })
  @ApiOkResponse({ type: PayrollRunListResultDto })
  async listPayrollRuns(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListPayrollRunsQueryParamsDto,
  ) {
    const parsed = parseListPayrollRuns(query);
    return this.payrollService.listPayrollRuns(institution.id, parsed);
  }

  @Post(API_ROUTES.PAYROLL_RUNS)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({ summary: "Create a payroll run (draft)" })
  @ApiCreatedResponse({ type: IdResponseDto })
  async createPayrollRun(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreatePayrollRunBodyDto,
  ) {
    const dto = parseCreatePayrollRun(body);
    return this.payrollService.createPayrollRun(institution.id, session, dto);
  }

  @Get(`${API_ROUTES.PAYROLL_RUNS}/:runId`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Get payroll run detail" })
  @ApiOkResponse({ type: PayrollRunDto })
  async getPayrollRun(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("runId") runId: string,
  ) {
    return this.payrollService.getPayrollRun(institution.id, runId);
  }

  @Post(`${API_ROUTES.PAYROLL_RUNS}/:runId/${API_ROUTES.PROCESS}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Process a payroll run (calculate all payslips)" })
  @ApiOkResponse({ type: IdResponseDto })
  async processPayrollRun(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("runId") runId: string,
  ) {
    return this.payrollService.processPayrollRun(
      institution.id,
      runId,
      session,
    );
  }

  @Post(`${API_ROUTES.PAYROLL_RUNS}/:runId/${API_ROUTES.APPROVE}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Approve a payroll run" })
  @ApiOkResponse({ type: IdResponseDto })
  async approvePayrollRun(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("runId") runId: string,
  ) {
    return this.payrollService.approvePayrollRun(
      institution.id,
      runId,
      session,
    );
  }

  @Post(`${API_ROUTES.PAYROLL_RUNS}/:runId/${API_ROUTES.MARK_PAID}`)
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark a payroll run as paid" })
  @ApiOkResponse({ type: IdResponseDto })
  async markPayrollRunPaid(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("runId") runId: string,
  ) {
    return this.payrollService.markPayrollRunPaid(
      institution.id,
      runId,
      session,
    );
  }

  // ── Payslips ────────────────────────────────────────────────────────────

  @Get(`${API_ROUTES.PAYROLL_RUNS}/:runId/${API_ROUTES.PAYSLIPS}`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "List payslips for a payroll run" })
  @ApiOkResponse({ type: PayslipListResultDto })
  async listPayslips(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("runId") runId: string,
    @Query() query: ListPayslipsQueryParamsDto,
  ) {
    const parsed = parseListPayslips(query);
    return this.payrollService.listPayslips(institution.id, runId, parsed);
  }

  @Get(`${API_ROUTES.PAYSLIPS}/:payslipId`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Get a single payslip with line items" })
  @ApiOkResponse({ type: PayslipDetailDto })
  async getPayslip(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("payslipId") payslipId: string,
  ) {
    return this.payrollService.getPayslip(institution.id, payslipId);
  }

  // ── Reports ─────────────────────────────────────────────────────────────

  @Get(`${API_ROUTES.REPORTS}/${API_ROUTES.MONTHLY_SUMMARY}`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Monthly payroll summary" })
  @ApiOkResponse({ type: MonthlySummaryResponseDto })
  async getMonthlySummary(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: MonthlySummaryQueryParamsDto,
  ) {
    const parsed = parseMonthlySummary(query);
    return this.payrollService.getMonthlySummary(institution.id, parsed);
  }

  @Get(`${API_ROUTES.REPORTS}/${API_ROUTES.STAFF_HISTORY}/:staffProfileId`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Staff salary history" })
  @ApiOkResponse({ type: StaffHistoryResponseDto })
  async getStaffHistory(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("staffProfileId") staffProfileId: string,
    @Query() query: StaffHistoryQueryParamsDto,
  ) {
    const parsed = parseStaffHistory(query);
    return this.payrollService.getStaffHistory(
      institution.id,
      staffProfileId,
      parsed,
    );
  }

  // ── Bank File Export ───────────────────────────────────────────────────

  @Get(`${API_ROUTES.PAYROLL_RUNS}/:runId/bank-file`)
  @RequirePermission(PERMISSIONS.PAYROLL_READ)
  @ApiOperation({ summary: "Download bank transfer file (CSV)" })
  async downloadBankFile(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("runId") runId: string,
    @Res() response: Response,
  ) {
    const { fileName, content } = await this.payrollService.generateBankFile(
      institution.id,
      runId,
    );

    response.setHeader("Content-Type", "text/csv");
    response.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileName}"`,
    );
    response.send(content);
  }

  // ── Statutory Components Seeding ──────────────────────────────────────

  @Post("seed-statutory")
  @RequirePermission(PERMISSIONS.PAYROLL_MANAGE)
  @ApiOperation({
    summary:
      "Seed Indian statutory salary components (PF, ESI, PT, TDS, Basic, HRA, DA)",
  })
  async seedStatutoryComponents(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
  ) {
    return this.payrollService.seedStatutoryComponents(institution.id, session);
  }
}
