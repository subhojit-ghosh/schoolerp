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
  CreateCategoryBodyDto,
  UpdateCategoryBodyDto,
  UpdateCategoryStatusBodyDto,
  ExpenseCategoryDto,
  ExpenseCategoryListResultDto,
  ListCategoriesQueryParamsDto,
  CreateExpenseBodyDto,
  UpdateExpenseBodyDto,
  ExpenseDto,
  ExpenseDetailDto,
  ExpenseListResultDto,
  ListExpensesQueryParamsDto,
  RejectExpenseBodyDto,
  MarkPaidBodyDto,
  ExpenseSummaryQueryParamsDto,
  ExpenseSummaryDto,
} from "./expenses.dto";
import {
  parseCreateCategory,
  parseUpdateCategory,
  parseUpdateCategoryStatus,
  parseListCategories,
  parseCreateExpense,
  parseUpdateExpense,
  parseListExpenses,
  parseRejectExpense,
  parseMarkPaid,
  parseExpenseSummaryQuery,
} from "./expenses.schemas";
import { ExpensesService } from "./expenses.service";

@ApiTags(API_DOCS.TAGS.EXPENSES)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  // ── Categories ──────────────────────────────────────────────────────────

  @Get(API_ROUTES.EXPENSE_CATEGORIES)
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  @ApiOperation({ summary: "List expense categories" })
  @ApiOkResponse({ type: ExpenseCategoryListResultDto })
  async listCategories(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListCategoriesQueryParamsDto,
  ) {
    const parsed = parseListCategories(query);
    return this.expensesService.listCategories(institution.id, parsed);
  }

  @Post(API_ROUTES.EXPENSE_CATEGORIES)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Create an expense category" })
  @ApiCreatedResponse({ type: ExpenseCategoryDto })
  async createCategory(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateCategoryBodyDto,
  ) {
    const dto = parseCreateCategory(body);
    return this.expensesService.createCategory(institution.id, session, dto);
  }

  @Patch(`${API_ROUTES.EXPENSE_CATEGORIES}/:categoryId`)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Update an expense category" })
  @ApiOkResponse({ type: ExpenseCategoryDto })
  async updateCategory(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateCategoryBodyDto,
  ) {
    const dto = parseUpdateCategory(body);
    return this.expensesService.updateCategory(
      institution.id,
      categoryId,
      session,
      dto,
    );
  }

  @Patch(`${API_ROUTES.EXPENSE_CATEGORIES}/:categoryId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Update expense category status" })
  @ApiOkResponse({ type: ExpenseCategoryDto })
  async updateCategoryStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateCategoryStatusBodyDto,
  ) {
    const dto = parseUpdateCategoryStatus(body);
    return this.expensesService.updateCategoryStatus(
      institution.id,
      categoryId,
      session,
      dto,
    );
  }

  // ── Expenses ────────────────────────────────────────────────────────────

  @Get(API_ROUTES.EXPENSES)
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  @ApiOperation({ summary: "List expenses" })
  @ApiOkResponse({ type: ExpenseListResultDto })
  async listExpenses(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListExpensesQueryParamsDto,
  ) {
    const parsed = parseListExpenses(query);
    return this.expensesService.listExpenses(institution.id, parsed);
  }

  @Post(API_ROUTES.EXPENSES)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Create an expense" })
  @ApiCreatedResponse({ type: ExpenseDto })
  async createExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateExpenseBodyDto,
  ) {
    const dto = parseCreateExpense(body);
    return this.expensesService.createExpense(institution.id, session, dto);
  }

  @Get(`${API_ROUTES.EXPENSES}/:expenseId`)
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  @ApiOperation({ summary: "Get expense detail" })
  @ApiOkResponse({ type: ExpenseDetailDto })
  async getExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("expenseId") expenseId: string,
  ) {
    return this.expensesService.getExpense(institution.id, expenseId);
  }

  @Patch(`${API_ROUTES.EXPENSES}/:expenseId`)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Update an expense (draft only)" })
  @ApiOkResponse({ type: ExpenseDto })
  async updateExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("expenseId") expenseId: string,
    @Body() body: UpdateExpenseBodyDto,
  ) {
    const dto = parseUpdateExpense(body);
    return this.expensesService.updateExpense(
      institution.id,
      expenseId,
      session,
      dto,
    );
  }

  // ── Workflow ────────────────────────────────────────────────────────────

  @Post(`${API_ROUTES.EXPENSES}/:expenseId/${API_ROUTES.SUBMIT}`)
  @RequirePermission(PERMISSIONS.EXPENSES_MANAGE)
  @ApiOperation({ summary: "Submit expense for approval" })
  @ApiOkResponse({ type: ExpenseDto })
  async submitExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("expenseId") expenseId: string,
  ) {
    return this.expensesService.submitExpense(
      institution.id,
      expenseId,
      session,
    );
  }

  @Post(`${API_ROUTES.EXPENSES}/:expenseId/${API_ROUTES.APPROVE}`)
  @RequirePermission(PERMISSIONS.EXPENSES_APPROVE)
  @ApiOperation({ summary: "Approve a submitted expense" })
  @ApiOkResponse({ type: ExpenseDto })
  async approveExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("expenseId") expenseId: string,
  ) {
    return this.expensesService.approveExpense(
      institution.id,
      expenseId,
      session,
    );
  }

  @Post(`${API_ROUTES.EXPENSES}/:expenseId/${API_ROUTES.REJECT}`)
  @RequirePermission(PERMISSIONS.EXPENSES_APPROVE)
  @ApiOperation({ summary: "Reject a submitted expense" })
  @ApiOkResponse({ type: ExpenseDto })
  async rejectExpense(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("expenseId") expenseId: string,
    @Body() body: RejectExpenseBodyDto,
  ) {
    const dto = parseRejectExpense(body);
    return this.expensesService.rejectExpense(
      institution.id,
      expenseId,
      session,
      dto,
    );
  }

  @Post(`${API_ROUTES.EXPENSES}/:expenseId/${API_ROUTES.MARK_PAID_EXPENSE}`)
  @RequirePermission(PERMISSIONS.EXPENSES_APPROVE)
  @ApiOperation({ summary: "Mark an approved expense as paid" })
  @ApiOkResponse({ type: ExpenseDto })
  async markPaid(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("expenseId") expenseId: string,
    @Body() body: MarkPaidBodyDto,
  ) {
    const dto = parseMarkPaid(body);
    return this.expensesService.markPaid(
      institution.id,
      expenseId,
      session,
      dto,
    );
  }

  // ── Reports ─────────────────────────────────────────────────────────────

  @Get(`${API_ROUTES.EXPENSES}/${API_ROUTES.REPORTS}/${API_ROUTES.SUMMARY}`)
  @RequirePermission(PERMISSIONS.EXPENSES_READ)
  @ApiOperation({ summary: "Get expense summary report" })
  @ApiOkResponse({ type: ExpenseSummaryDto })
  async expenseSummary(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ExpenseSummaryQueryParamsDto,
  ) {
    const parsed = parseExpenseSummaryQuery(query);
    return this.expensesService.expenseSummary(institution.id, parsed);
  }
}
