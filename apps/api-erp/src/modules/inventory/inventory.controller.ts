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
  CategoryDto,
  CategoryListResultDto,
  CreateItemBodyDto,
  UpdateItemBodyDto,
  UpdateItemStatusBodyDto,
  ItemDto,
  ItemListResultDto,
  ItemDetailDto,
  CreateStockTransactionBodyDto,
  StockTransactionDto,
  StockTransactionListResultDto,
  ListCategoriesQueryParamsDto,
  ListItemsQueryParamsDto,
  ListTransactionsQueryParamsDto,
  ListItemTransactionsQueryParamsDto,
  ListLowStockQueryParamsDto,
} from "./inventory.dto";
import {
  parseCreateCategory,
  parseUpdateCategory,
  parseUpdateCategoryStatus,
  parseListCategories,
  parseCreateItem,
  parseUpdateItem,
  parseUpdateItemStatus,
  parseListItems,
  parseCreateStockTransaction,
  parseListTransactions,
  parseListItemTransactions,
  parseListLowStock,
} from "./inventory.schemas";
import { InventoryService } from "./inventory.service";

@ApiTags(API_DOCS.TAGS.INVENTORY)
@ApiCookieAuth()
@UseGuards(SessionAuthGuard, TenantInstitutionGuard, PermissionGuard)
@Controller(API_ROUTES.INVENTORY)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ── Categories ─────────────────────────────────────────────────────────

  @Get(API_ROUTES.CATEGORIES)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "List inventory categories" })
  @ApiOkResponse({ type: CategoryListResultDto })
  async listCategories(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListCategoriesQueryParamsDto,
  ) {
    const parsed = parseListCategories(query);
    return this.inventoryService.listCategories(institution.id, parsed);
  }

  @Post(API_ROUTES.CATEGORIES)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Create an inventory category" })
  @ApiCreatedResponse({ type: CategoryDto })
  async createCategory(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateCategoryBodyDto,
  ) {
    const dto = parseCreateCategory(body);
    return this.inventoryService.createCategory(institution.id, session, dto);
  }

  @Patch(`${API_ROUTES.CATEGORIES}/:categoryId`)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Update an inventory category" })
  @ApiOkResponse({ type: CategoryDto })
  async updateCategory(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateCategoryBodyDto,
  ) {
    const dto = parseUpdateCategory(body);
    return this.inventoryService.updateCategory(institution.id, categoryId, session, dto);
  }

  @Patch(`${API_ROUTES.CATEGORIES}/:categoryId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Update inventory category status" })
  @ApiOkResponse({ type: CategoryDto })
  async updateCategoryStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("categoryId") categoryId: string,
    @Body() body: UpdateCategoryStatusBodyDto,
  ) {
    const dto = parseUpdateCategoryStatus(body);
    return this.inventoryService.updateCategoryStatus(
      institution.id,
      categoryId,
      session,
      dto,
    );
  }

  // ── Items ──────────────────────────────────────────────────────────────

  @Get(API_ROUTES.ITEMS)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "List inventory items" })
  @ApiOkResponse({ type: ItemListResultDto })
  async listItems(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListItemsQueryParamsDto,
  ) {
    const parsed = parseListItems(query);
    return this.inventoryService.listItems(institution.id, parsed);
  }

  @Post(API_ROUTES.ITEMS)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Create an inventory item" })
  @ApiCreatedResponse({ type: ItemDto })
  async createItem(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateItemBodyDto,
  ) {
    const dto = parseCreateItem(body);
    return this.inventoryService.createItem(institution.id, session, dto);
  }

  @Get(`${API_ROUTES.ITEMS}/:itemId`)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "Get inventory item detail" })
  @ApiOkResponse({ type: ItemDetailDto })
  async getItem(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("itemId") itemId: string,
  ) {
    return this.inventoryService.getItem(institution.id, itemId);
  }

  @Patch(`${API_ROUTES.ITEMS}/:itemId`)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Update an inventory item" })
  @ApiOkResponse({ type: ItemDetailDto })
  async updateItem(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("itemId") itemId: string,
    @Body() body: UpdateItemBodyDto,
  ) {
    const dto = parseUpdateItem(body);
    return this.inventoryService.updateItem(institution.id, itemId, session, dto);
  }

  @Patch(`${API_ROUTES.ITEMS}/:itemId/${API_ROUTES.STATUS}`)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Update inventory item status" })
  @ApiOkResponse({ type: ItemDto })
  async updateItemStatus(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Param("itemId") itemId: string,
    @Body() body: UpdateItemStatusBodyDto,
  ) {
    const dto = parseUpdateItemStatus(body);
    return this.inventoryService.updateItemStatus(institution.id, itemId, session, dto);
  }

  @Get(`${API_ROUTES.ITEMS}/:itemId/${API_ROUTES.TRANSACTIONS}`)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "List stock transactions for an item" })
  @ApiOkResponse({ type: StockTransactionListResultDto })
  async listItemTransactions(
    @CurrentInstitution() institution: TenantInstitution,
    @Param("itemId") itemId: string,
    @Query() query: ListItemTransactionsQueryParamsDto,
  ) {
    const parsed = parseListItemTransactions(query);
    return this.inventoryService.listItemTransactions(institution.id, itemId, parsed);
  }

  // ── Transactions ───────────────────────────────────────────────────────

  @Post(API_ROUTES.TRANSACTIONS)
  @RequirePermission(PERMISSIONS.INVENTORY_MANAGE)
  @ApiOperation({ summary: "Create a stock transaction" })
  @ApiCreatedResponse({ type: StockTransactionDto })
  async createStockTransaction(
    @CurrentInstitution() institution: TenantInstitution,
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: CreateStockTransactionBodyDto,
  ) {
    const dto = parseCreateStockTransaction(body);
    return this.inventoryService.createStockTransaction(institution.id, session, dto);
  }

  @Get(API_ROUTES.TRANSACTIONS)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "List all stock transactions" })
  @ApiOkResponse({ type: StockTransactionListResultDto })
  async listTransactions(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListTransactionsQueryParamsDto,
  ) {
    const parsed = parseListTransactions(query);
    return this.inventoryService.listTransactions(institution.id, parsed);
  }

  // ── Low Stock ──────────────────────────────────────────────────────────

  @Get(API_ROUTES.LOW_STOCK)
  @RequirePermission(PERMISSIONS.INVENTORY_READ)
  @ApiOperation({ summary: "List items below minimum stock" })
  @ApiOkResponse({ type: ItemListResultDto })
  async listLowStock(
    @CurrentInstitution() institution: TenantInstitution,
    @Query() query: ListLowStockQueryParamsDto,
  ) {
    const parsed = parseListLowStock(query);
    return this.inventoryService.listLowStock(institution.id, parsed);
  }
}
