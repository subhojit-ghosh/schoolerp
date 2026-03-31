import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  lte,
  ne,
  or,
  sql,
  inventoryCategories,
  inventoryItems,
  stockTransactions,
  vendors,
  purchaseOrders,
  purchaseOrderItems,
  member,
  user,
  type AppDatabase,
} from "@repo/database";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  INVENTORY_CATEGORY_STATUS,
  INVENTORY_ITEM_STATUS,
  PURCHASE_ORDER_STATUS,
  STOCK_TRANSACTION_TYPES,
  VENDOR_STATUS,
} from "@repo/contracts";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolveTablePageSize, resolvePagination } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateCategoryDto,
  UpdateCategoryDto,
  UpdateCategoryStatusDto,
  ListCategoriesQueryDto,
  CreateItemDto,
  UpdateItemDto,
  UpdateItemStatusDto,
  ListItemsQueryDto,
  CreateStockTransactionDto,
  ListTransactionsQueryDto,
  ListItemTransactionsQueryDto,
  ListLowStockQueryDto,
  CreateVendorDto,
  UpdateVendorDto,
  UpdateVendorStatusDto,
  ListVendorsQueryDto,
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  UpdatePurchaseOrderStatusDto,
  ListPurchaseOrdersQueryDto,
  ReceivePurchaseOrderDto,
} from "./inventory.schemas";

// ── Sort maps ─────────────────────────────────────────────────────────────

const categorySortColumns = {
  name: inventoryCategories.name,
  createdAt: inventoryCategories.createdAt,
} as const;

const itemSortColumns = {
  name: inventoryItems.name,
  currentStock: inventoryItems.currentStock,
  createdAt: inventoryItems.createdAt,
} as const;

const transactionSortColumns = {
  createdAt: stockTransactions.createdAt,
  quantity: stockTransactions.quantity,
} as const;

const vendorSortColumns = {
  name: vendors.name,
  createdAt: vendors.createdAt,
} as const;

const purchaseOrderSortColumns = {
  orderDate: purchaseOrders.orderDate,
  createdAt: purchaseOrders.createdAt,
  orderNumber: purchaseOrders.orderNumber,
} as const;

@Injectable()
export class InventoryService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── Categories ─────────────────────────────────────────────────────────

  async listCategories(institutionId: string, query: ListCategoriesQueryDto) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = categorySortColumns[sort ?? "name"];

    const conditions = [eq(inventoryCategories.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(inventoryCategories.status, status));
    } else {
      conditions.push(
        ne(inventoryCategories.status, INVENTORY_CATEGORY_STATUS.DELETED),
      );
    }
    if (q) {
      conditions.push(ilike(inventoryCategories.name, `%${q}%`));
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(inventoryCategories)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: inventoryCategories.id,
        name: inventoryCategories.name,
        description: inventoryCategories.description,
        status: inventoryCategories.status,
        createdAt: inventoryCategories.createdAt,
      })
      .from(inventoryCategories)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async createCategory(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateCategoryDto,
  ) {
    const id = randomUUID();
    await this.db.insert(inventoryCategories).values({
      id,
      institutionId,
      name: dto.name,
      description: dto.description ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_CATEGORY,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created inventory category "${dto.name}"`,
    });

    return { id };
  }

  async updateCategory(
    institutionId: string,
    categoryId: string,
    session: AuthenticatedSession,
    dto: UpdateCategoryDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(inventoryCategories)
      .where(
        and(
          eq(inventoryCategories.id, categoryId),
          eq(inventoryCategories.institutionId, institutionId),
          ne(inventoryCategories.status, INVENTORY_CATEGORY_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.CATEGORY_NOT_FOUND);
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.description !== undefined) updates.description = dto.description;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(inventoryCategories)
        .set(updates)
        .where(eq(inventoryCategories.id, categoryId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_CATEGORY,
      entityId: categoryId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated inventory category "${dto.name ?? existing.name}"`,
    });

    return { id: categoryId };
  }

  async updateCategoryStatus(
    institutionId: string,
    categoryId: string,
    session: AuthenticatedSession,
    dto: UpdateCategoryStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(inventoryCategories)
      .where(
        and(
          eq(inventoryCategories.id, categoryId),
          eq(inventoryCategories.institutionId, institutionId),
          ne(inventoryCategories.status, INVENTORY_CATEGORY_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.CATEGORY_NOT_FOUND);
    }

    await this.db
      .update(inventoryCategories)
      .set({ status: dto.status })
      .where(eq(inventoryCategories.id, categoryId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_CATEGORY,
      entityId: categoryId,
      entityLabel: existing.name,
      summary: `Changed inventory category "${existing.name}" status to ${dto.status}`,
    });

    return { id: categoryId };
  }

  // ── Items ──────────────────────────────────────────────────────────────

  async listItems(institutionId: string, query: ListItemsQueryDto) {
    const { q, status, categoryId, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = itemSortColumns[sort ?? "name"];

    const conditions = [eq(inventoryItems.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(inventoryItems.status, status));
    } else {
      conditions.push(ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED));
    }
    if (categoryId) {
      conditions.push(eq(inventoryItems.categoryId, categoryId));
    }
    if (q) {
      conditions.push(
        or(
          ilike(inventoryItems.name, `%${q}%`),
          ilike(inventoryItems.sku, `%${q}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(inventoryItems)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        categoryId: inventoryItems.categoryId,
        categoryName: inventoryCategories.name,
        sku: inventoryItems.sku,
        unit: inventoryItems.unit,
        currentStock: inventoryItems.currentStock,
        minimumStock: inventoryItems.minimumStock,
        location: inventoryItems.location,
        purchasePriceInPaise: inventoryItems.purchasePriceInPaise,
        status: inventoryItems.status,
        createdAt: inventoryItems.createdAt,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.categoryId, inventoryCategories.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async getItem(institutionId: string, itemId: string) {
    const [item] = await this.db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        categoryId: inventoryItems.categoryId,
        categoryName: inventoryCategories.name,
        sku: inventoryItems.sku,
        unit: inventoryItems.unit,
        currentStock: inventoryItems.currentStock,
        minimumStock: inventoryItems.minimumStock,
        location: inventoryItems.location,
        purchasePriceInPaise: inventoryItems.purchasePriceInPaise,
        status: inventoryItems.status,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.categoryId, inventoryCategories.id),
      )
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.institutionId, institutionId),
          ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
        ),
      );

    if (!item) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
    }

    return item;
  }

  async createItem(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateItemDto,
  ) {
    // Verify category exists
    const [category] = await this.db
      .select({ id: inventoryCategories.id })
      .from(inventoryCategories)
      .where(
        and(
          eq(inventoryCategories.id, dto.categoryId),
          eq(inventoryCategories.institutionId, institutionId),
          ne(inventoryCategories.status, INVENTORY_CATEGORY_STATUS.DELETED),
        ),
      );

    if (!category) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.CATEGORY_NOT_FOUND);
    }

    const id = randomUUID();
    await this.db.insert(inventoryItems).values({
      id,
      institutionId,
      categoryId: dto.categoryId,
      name: dto.name,
      sku: dto.sku ?? null,
      unit: dto.unit ?? "piece",
      currentStock: 0,
      minimumStock: dto.minimumStock ?? 0,
      location: dto.location ?? null,
      purchasePriceInPaise: dto.purchasePriceInPaise ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created inventory item "${dto.name}"`,
    });

    return { id };
  }

  async updateItem(
    institutionId: string,
    itemId: string,
    session: AuthenticatedSession,
    dto: UpdateItemDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.institutionId, institutionId),
          ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
    }

    if (dto.categoryId) {
      const [category] = await this.db
        .select({ id: inventoryCategories.id })
        .from(inventoryCategories)
        .where(
          and(
            eq(inventoryCategories.id, dto.categoryId),
            eq(inventoryCategories.institutionId, institutionId),
            ne(inventoryCategories.status, INVENTORY_CATEGORY_STATUS.DELETED),
          ),
        );

      if (!category) {
        throw new NotFoundException(
          ERROR_MESSAGES.INVENTORY.CATEGORY_NOT_FOUND,
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.categoryId !== undefined) updates.categoryId = dto.categoryId;
    if (dto.sku !== undefined) updates.sku = dto.sku;
    if (dto.unit !== undefined) updates.unit = dto.unit;
    if (dto.minimumStock !== undefined) updates.minimumStock = dto.minimumStock;
    if (dto.location !== undefined) updates.location = dto.location;
    if (dto.purchasePriceInPaise !== undefined)
      updates.purchasePriceInPaise = dto.purchasePriceInPaise;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(inventoryItems)
        .set(updates)
        .where(eq(inventoryItems.id, itemId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
      entityId: itemId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated inventory item "${dto.name ?? existing.name}"`,
    });

    return { id: itemId };
  }

  async updateItemStatus(
    institutionId: string,
    itemId: string,
    session: AuthenticatedSession,
    dto: UpdateItemStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.institutionId, institutionId),
          ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
        ),
      );

    if (!existing) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
    }

    await this.db
      .update(inventoryItems)
      .set({ status: dto.status })
      .where(eq(inventoryItems.id, itemId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.INVENTORY_ITEM,
      entityId: itemId,
      entityLabel: existing.name,
      summary: `Changed inventory item "${existing.name}" status to ${dto.status}`,
    });

    return { id: itemId };
  }

  // ── Stock Transactions ─────────────────────────────────────────────────

  async createStockTransaction(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateStockTransactionDto,
  ) {
    const [item] = await this.db
      .select()
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, dto.itemId),
          eq(inventoryItems.institutionId, institutionId),
          ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
        ),
      );

    if (!item) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
    }

    // Validate member for issue/return
    if (dto.issuedToMembershipId) {
      const [memberRow] = await this.db
        .select({ id: member.id })
        .from(member)
        .where(eq(member.id, dto.issuedToMembershipId));

      if (!memberRow) {
        throw new NotFoundException(ERROR_MESSAGES.INVENTORY.MEMBER_NOT_FOUND);
      }
    }

    let newStock = item.currentStock;
    if (
      dto.transactionType === STOCK_TRANSACTION_TYPES.PURCHASE ||
      dto.transactionType === STOCK_TRANSACTION_TYPES.RETURN
    ) {
      newStock = item.currentStock + dto.quantity;
    } else if (dto.transactionType === STOCK_TRANSACTION_TYPES.ISSUE) {
      newStock = item.currentStock - dto.quantity;
      if (newStock < 0) {
        throw new BadRequestException(
          ERROR_MESSAGES.INVENTORY.INSUFFICIENT_STOCK,
        );
      }
    } else if (dto.transactionType === STOCK_TRANSACTION_TYPES.ADJUSTMENT) {
      newStock = item.currentStock + dto.quantity;
    }

    // Look up the current user's membership to use as createdByMemberId
    const [createdByMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!createdByMember) {
      throw new BadRequestException("Active membership is required.");
    }

    const id = randomUUID();

    await this.db.insert(stockTransactions).values({
      id,
      institutionId,
      itemId: dto.itemId,
      transactionType: dto.transactionType,
      quantity: dto.quantity,
      referenceNumber: dto.referenceNumber ?? null,
      issuedToMembershipId: dto.issuedToMembershipId ?? null,
      departmentName: dto.departmentName ?? null,
      purchaseOrderId: dto.purchaseOrderId ?? null,
      unitPriceInPaise: dto.unitPriceInPaise ?? null,
      notes: dto.notes ?? null,
      createdByMemberId: createdByMember.id,
    });

    await this.db
      .update(inventoryItems)
      .set({ currentStock: newStock })
      .where(eq(inventoryItems.id, dto.itemId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.STOCK_TRANSACTION,
      entityId: id,
      entityLabel: item.name,
      summary: `${dto.transactionType} ${dto.quantity} units of "${item.name}" (stock: ${item.currentStock} -> ${newStock})`,
    });

    return { id, newStock };
  }

  async listTransactions(
    institutionId: string,
    query: ListTransactionsQueryDto,
  ) {
    const { q, transactionType, itemId, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = transactionSortColumns[sort ?? "createdAt"];

    const conditions = [eq(stockTransactions.institutionId, institutionId)];
    if (transactionType) {
      conditions.push(eq(stockTransactions.transactionType, transactionType));
    }
    if (itemId) {
      conditions.push(eq(stockTransactions.itemId, itemId));
    }
    if (q) {
      conditions.push(
        or(
          ilike(inventoryItems.name, `%${q}%`),
          ilike(stockTransactions.referenceNumber, `%${q}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(stockTransactions)
      .leftJoin(inventoryItems, eq(stockTransactions.itemId, inventoryItems.id))
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: stockTransactions.id,
        itemId: stockTransactions.itemId,
        itemName: inventoryItems.name,
        transactionType: stockTransactions.transactionType,
        quantity: stockTransactions.quantity,
        referenceNumber: stockTransactions.referenceNumber,
        issuedToMembershipId: stockTransactions.issuedToMembershipId,
        departmentName: stockTransactions.departmentName,
        purchaseOrderId: stockTransactions.purchaseOrderId,
        unitPriceInPaise: stockTransactions.unitPriceInPaise,
        notes: stockTransactions.notes,
        createdByMemberId: stockTransactions.createdByMemberId,
        createdAt: stockTransactions.createdAt,
      })
      .from(stockTransactions)
      .leftJoin(inventoryItems, eq(stockTransactions.itemId, inventoryItems.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve member names
    const memberIds = new Set<string>();
    for (const row of rows) {
      memberIds.add(row.createdByMemberId);
      if (row.issuedToMembershipId) memberIds.add(row.issuedToMembershipId);
    }

    const memberNames = await this.resolveMemberNames(Array.from(memberIds));

    const enrichedRows = rows.map((row) => ({
      ...row,
      issuedToName: row.issuedToMembershipId
        ? (memberNames.get(row.issuedToMembershipId) ?? null)
        : null,
      createdByName: memberNames.get(row.createdByMemberId) ?? "Unknown",
    }));

    return { rows: enrichedRows, total, page: safePage, pageSize, pageCount };
  }

  async listItemTransactions(
    institutionId: string,
    itemId: string,
    query: ListItemTransactionsQueryDto,
  ) {
    // Verify item exists
    const [item] = await this.db
      .select({ id: inventoryItems.id })
      .from(inventoryItems)
      .where(
        and(
          eq(inventoryItems.id, itemId),
          eq(inventoryItems.institutionId, institutionId),
        ),
      );

    if (!item) {
      throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
    }

    return this.listTransactions(institutionId, {
      ...query,
      itemId,
    });
  }

  async listLowStock(institutionId: string, query: ListLowStockQueryDto) {
    const { q, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = itemSortColumns[sort ?? "currentStock"];

    const conditions = [
      eq(inventoryItems.institutionId, institutionId),
      eq(inventoryItems.status, INVENTORY_ITEM_STATUS.ACTIVE),
      lte(inventoryItems.currentStock, inventoryItems.minimumStock),
    ];
    if (q) {
      conditions.push(
        or(
          ilike(inventoryItems.name, `%${q}%`),
          ilike(inventoryItems.sku, `%${q}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(inventoryItems)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        categoryId: inventoryItems.categoryId,
        categoryName: inventoryCategories.name,
        sku: inventoryItems.sku,
        unit: inventoryItems.unit,
        currentStock: inventoryItems.currentStock,
        minimumStock: inventoryItems.minimumStock,
        location: inventoryItems.location,
        purchasePriceInPaise: inventoryItems.purchasePriceInPaise,
        status: inventoryItems.status,
        createdAt: inventoryItems.createdAt,
      })
      .from(inventoryItems)
      .leftJoin(
        inventoryCategories,
        eq(inventoryItems.categoryId, inventoryCategories.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  // ── Vendors ────────────────────────────────────────────────────────────

  async listVendors(institutionId: string, query: ListVendorsQueryDto) {
    const { q, status, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = vendorSortColumns[sort ?? "name"];

    const conditions = [eq(vendors.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(vendors.status, status));
    }
    if (q) {
      conditions.push(
        or(
          ilike(vendors.name, `%${q}%`),
          ilike(vendors.contactPerson, `%${q}%`),
          ilike(vendors.phone, `%${q}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(vendors)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: vendors.id,
        name: vendors.name,
        contactPerson: vendors.contactPerson,
        phone: vendors.phone,
        email: vendors.email,
        address: vendors.address,
        gstNumber: vendors.gstNumber,
        status: vendors.status,
        createdAt: vendors.createdAt,
      })
      .from(vendors)
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return { rows, total, page: safePage, pageSize, pageCount };
  }

  async createVendor(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateVendorDto,
  ) {
    const id = randomUUID();
    await this.db.insert(vendors).values({
      id,
      institutionId,
      name: dto.name,
      contactPerson: dto.contactPerson ?? null,
      phone: dto.phone ?? null,
      email: dto.email ?? null,
      address: dto.address ?? null,
      gstNumber: dto.gstNumber ?? null,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: id,
      entityLabel: dto.name,
      summary: `Created vendor "${dto.name}"`,
    });

    return { id };
  }

  async updateVendor(
    institutionId: string,
    vendorId: string,
    session: AuthenticatedSession,
    dto: UpdateVendorDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.id, vendorId),
          eq(vendors.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.VENDOR_NOT_FOUND,
      );
    }

    const updates: Record<string, unknown> = {};
    if (dto.name !== undefined) updates.name = dto.name;
    if (dto.contactPerson !== undefined) updates.contactPerson = dto.contactPerson;
    if (dto.phone !== undefined) updates.phone = dto.phone;
    if (dto.email !== undefined) updates.email = dto.email;
    if (dto.address !== undefined) updates.address = dto.address;
    if (dto.gstNumber !== undefined) updates.gstNumber = dto.gstNumber;

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(vendors)
        .set(updates)
        .where(eq(vendors.id, vendorId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: vendorId,
      entityLabel: dto.name ?? existing.name,
      summary: `Updated vendor "${dto.name ?? existing.name}"`,
    });

    return { id: vendorId };
  }

  async updateVendorStatus(
    institutionId: string,
    vendorId: string,
    session: AuthenticatedSession,
    dto: UpdateVendorStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(vendors)
      .where(
        and(
          eq(vendors.id, vendorId),
          eq(vendors.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.VENDOR_NOT_FOUND,
      );
    }

    // Check for active purchase orders when deactivating
    if (dto.status === VENDOR_STATUS.INACTIVE) {
      const [activeOrder] = await this.db
        .select({ id: purchaseOrders.id })
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.vendorId, vendorId),
            or(
              eq(purchaseOrders.status, PURCHASE_ORDER_STATUS.DRAFT),
              eq(purchaseOrders.status, PURCHASE_ORDER_STATUS.ORDERED),
              eq(
                purchaseOrders.status,
                PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED,
              ),
            ),
          ),
        )
        .limit(1);

      if (activeOrder) {
        throw new ConflictException(
          ERROR_MESSAGES.INVENTORY_DEPTH.VENDOR_HAS_ORDERS,
        );
      }
    }

    await this.db
      .update(vendors)
      .set({ status: dto.status })
      .where(eq(vendors.id, vendorId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.VENDOR,
      entityId: vendorId,
      entityLabel: existing.name,
      summary: `Changed vendor "${existing.name}" status to ${dto.status}`,
    });

    return { id: vendorId };
  }

  // ── Purchase Orders ───────────────────────────────────────────────────

  async listPurchaseOrders(
    institutionId: string,
    query: ListPurchaseOrdersQueryDto,
  ) {
    const { q, status, vendorId, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = purchaseOrderSortColumns[sort ?? "createdAt"];

    const conditions = [eq(purchaseOrders.institutionId, institutionId)];
    if (status) {
      conditions.push(eq(purchaseOrders.status, status));
    }
    if (vendorId) {
      conditions.push(eq(purchaseOrders.vendorId, vendorId));
    }
    if (q) {
      conditions.push(
        or(
          ilike(purchaseOrders.orderNumber, `%${q}%`),
          ilike(vendors.name, `%${q}%`),
        )!,
      );
    }

    const where = and(...conditions);

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: purchaseOrders.id,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        orderNumber: purchaseOrders.orderNumber,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        totalAmountInPaise: purchaseOrders.totalAmountInPaise,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        createdByMemberId: purchaseOrders.createdByMemberId,
        createdAt: purchaseOrders.createdAt,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    // Resolve member names for createdBy
    const memberIds = rows.map((r) => r.createdByMemberId);
    const memberNames = await this.resolveMemberNames(memberIds);

    const enrichedRows = rows.map((row) => ({
      ...row,
      createdByName: memberNames.get(row.createdByMemberId) ?? "Unknown",
    }));

    return { rows: enrichedRows, total, page: safePage, pageSize, pageCount };
  }

  async getPurchaseOrder(institutionId: string, orderId: string) {
    const [order] = await this.db
      .select({
        id: purchaseOrders.id,
        vendorId: purchaseOrders.vendorId,
        vendorName: vendors.name,
        orderNumber: purchaseOrders.orderNumber,
        orderDate: purchaseOrders.orderDate,
        expectedDeliveryDate: purchaseOrders.expectedDeliveryDate,
        totalAmountInPaise: purchaseOrders.totalAmountInPaise,
        status: purchaseOrders.status,
        notes: purchaseOrders.notes,
        createdByMemberId: purchaseOrders.createdByMemberId,
        createdAt: purchaseOrders.createdAt,
        updatedAt: purchaseOrders.updatedAt,
      })
      .from(purchaseOrders)
      .leftJoin(vendors, eq(purchaseOrders.vendorId, vendors.id))
      .where(
        and(
          eq(purchaseOrders.id, orderId),
          eq(purchaseOrders.institutionId, institutionId),
        ),
      );

    if (!order) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NOT_FOUND,
      );
    }

    const items = await this.db
      .select({
        id: purchaseOrderItems.id,
        itemId: purchaseOrderItems.itemId,
        itemName: inventoryItems.name,
        quantityOrdered: purchaseOrderItems.quantityOrdered,
        quantityReceived: purchaseOrderItems.quantityReceived,
        unitPriceInPaise: purchaseOrderItems.unitPriceInPaise,
      })
      .from(purchaseOrderItems)
      .leftJoin(
        inventoryItems,
        eq(purchaseOrderItems.itemId, inventoryItems.id),
      )
      .where(eq(purchaseOrderItems.purchaseOrderId, orderId));

    const memberNames = await this.resolveMemberNames([
      order.createdByMemberId,
    ]);

    return {
      ...order,
      createdByName:
        memberNames.get(order.createdByMemberId) ?? "Unknown",
      items,
    };
  }

  async createPurchaseOrder(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreatePurchaseOrderDto,
  ) {
    // Verify vendor exists and is active
    const [vendor] = await this.db
      .select({ id: vendors.id, name: vendors.name })
      .from(vendors)
      .where(
        and(
          eq(vendors.id, dto.vendorId),
          eq(vendors.institutionId, institutionId),
          eq(vendors.status, VENDOR_STATUS.ACTIVE),
        ),
      );

    if (!vendor) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.VENDOR_NOT_FOUND,
      );
    }

    // Check order number uniqueness
    const [existing] = await this.db
      .select({ id: purchaseOrders.id })
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.institutionId, institutionId),
          eq(purchaseOrders.orderNumber, dto.orderNumber),
        ),
      );

    if (existing) {
      throw new ConflictException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NUMBER_EXISTS,
      );
    }

    // Verify all items exist
    for (const line of dto.items) {
      const [item] = await this.db
        .select({ id: inventoryItems.id })
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.id, line.itemId),
            eq(inventoryItems.institutionId, institutionId),
            ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
          ),
        );

      if (!item) {
        throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
      }
    }

    // Resolve member
    const [createdByMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!createdByMember) {
      throw new BadRequestException("Active membership is required.");
    }

    const totalAmountInPaise = dto.items.reduce(
      (sum, line) => sum + line.quantityOrdered * line.unitPriceInPaise,
      0,
    );

    const id = randomUUID();

    await this.db.insert(purchaseOrders).values({
      id,
      institutionId,
      vendorId: dto.vendorId,
      orderNumber: dto.orderNumber,
      orderDate: dto.orderDate,
      expectedDeliveryDate: dto.expectedDeliveryDate ?? null,
      totalAmountInPaise,
      notes: dto.notes ?? null,
      createdByMemberId: createdByMember.id,
    });

    for (const line of dto.items) {
      await this.db.insert(purchaseOrderItems).values({
        id: randomUUID(),
        purchaseOrderId: id,
        itemId: line.itemId,
        quantityOrdered: line.quantityOrdered,
        unitPriceInPaise: line.unitPriceInPaise,
      });
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
      entityId: id,
      entityLabel: dto.orderNumber,
      summary: `Created purchase order "${dto.orderNumber}" for vendor "${vendor.name}"`,
    });

    return { id };
  }

  async updatePurchaseOrder(
    institutionId: string,
    orderId: string,
    session: AuthenticatedSession,
    dto: UpdatePurchaseOrderDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, orderId),
          eq(purchaseOrders.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NOT_FOUND,
      );
    }

    if (existing.status !== PURCHASE_ORDER_STATUS.DRAFT) {
      throw new BadRequestException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NOT_DRAFT,
      );
    }

    // Verify vendor if changing
    if (dto.vendorId) {
      const [vendor] = await this.db
        .select({ id: vendors.id })
        .from(vendors)
        .where(
          and(
            eq(vendors.id, dto.vendorId),
            eq(vendors.institutionId, institutionId),
            eq(vendors.status, VENDOR_STATUS.ACTIVE),
          ),
        );

      if (!vendor) {
        throw new NotFoundException(
          ERROR_MESSAGES.INVENTORY_DEPTH.VENDOR_NOT_FOUND,
        );
      }
    }

    // Check order number uniqueness if changing
    if (dto.orderNumber && dto.orderNumber !== existing.orderNumber) {
      const [dup] = await this.db
        .select({ id: purchaseOrders.id })
        .from(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.institutionId, institutionId),
            eq(purchaseOrders.orderNumber, dto.orderNumber),
            ne(purchaseOrders.id, orderId),
          ),
        );

      if (dup) {
        throw new ConflictException(
          ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NUMBER_EXISTS,
        );
      }
    }

    const updates: Record<string, unknown> = {};
    if (dto.vendorId !== undefined) updates.vendorId = dto.vendorId;
    if (dto.orderNumber !== undefined) updates.orderNumber = dto.orderNumber;
    if (dto.orderDate !== undefined) updates.orderDate = dto.orderDate;
    if (dto.expectedDeliveryDate !== undefined)
      updates.expectedDeliveryDate = dto.expectedDeliveryDate;
    if (dto.notes !== undefined) updates.notes = dto.notes;

    // Replace items if provided
    if (dto.items) {
      // Verify all items exist
      for (const line of dto.items) {
        const [item] = await this.db
          .select({ id: inventoryItems.id })
          .from(inventoryItems)
          .where(
            and(
              eq(inventoryItems.id, line.itemId),
              eq(inventoryItems.institutionId, institutionId),
              ne(inventoryItems.status, INVENTORY_ITEM_STATUS.DELETED),
            ),
          );

        if (!item) {
          throw new NotFoundException(ERROR_MESSAGES.INVENTORY.ITEM_NOT_FOUND);
        }
      }

      // Delete old items and insert new
      await this.db
        .delete(purchaseOrderItems)
        .where(eq(purchaseOrderItems.purchaseOrderId, orderId));

      for (const line of dto.items) {
        await this.db.insert(purchaseOrderItems).values({
          id: randomUUID(),
          purchaseOrderId: orderId,
          itemId: line.itemId,
          quantityOrdered: line.quantityOrdered,
          unitPriceInPaise: line.unitPriceInPaise,
        });
      }

      updates.totalAmountInPaise = dto.items.reduce(
        (sum, line) => sum + line.quantityOrdered * line.unitPriceInPaise,
        0,
      );
    }

    if (Object.keys(updates).length > 0) {
      await this.db
        .update(purchaseOrders)
        .set(updates)
        .where(eq(purchaseOrders.id, orderId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
      entityId: orderId,
      entityLabel: dto.orderNumber ?? existing.orderNumber,
      summary: `Updated purchase order "${dto.orderNumber ?? existing.orderNumber}"`,
    });

    return { id: orderId };
  }

  async updatePurchaseOrderStatus(
    institutionId: string,
    orderId: string,
    session: AuthenticatedSession,
    dto: UpdatePurchaseOrderStatusDto,
  ) {
    const [existing] = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, orderId),
          eq(purchaseOrders.institutionId, institutionId),
        ),
      );

    if (!existing) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NOT_FOUND,
      );
    }

    await this.db
      .update(purchaseOrders)
      .set({ status: dto.status })
      .where(eq(purchaseOrders.id, orderId));

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
      entityId: orderId,
      entityLabel: existing.orderNumber,
      summary: `Changed purchase order "${existing.orderNumber}" status to ${dto.status}`,
    });

    return { id: orderId };
  }

  // ── Receive (GRN) ────────────────────────────────────────────────────

  async receivePurchaseOrder(
    institutionId: string,
    orderId: string,
    session: AuthenticatedSession,
    dto: ReceivePurchaseOrderDto,
  ) {
    const [order] = await this.db
      .select()
      .from(purchaseOrders)
      .where(
        and(
          eq(purchaseOrders.id, orderId),
          eq(purchaseOrders.institutionId, institutionId),
        ),
      );

    if (!order) {
      throw new NotFoundException(
        ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_NOT_FOUND,
      );
    }

    // Resolve member for stock transactions
    const [createdByMember] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
        ),
      );

    if (!createdByMember) {
      throw new BadRequestException("Active membership is required.");
    }

    // Process each receive line
    for (const line of dto.lines) {
      const [poItem] = await this.db
        .select()
        .from(purchaseOrderItems)
        .where(
          and(
            eq(purchaseOrderItems.id, line.purchaseOrderItemId),
            eq(purchaseOrderItems.purchaseOrderId, orderId),
          ),
        );

      if (!poItem) {
        throw new NotFoundException(
          ERROR_MESSAGES.INVENTORY_DEPTH.PURCHASE_ORDER_ITEM_NOT_FOUND,
        );
      }

      const newReceived = poItem.quantityReceived + line.quantityReceived;
      if (newReceived > poItem.quantityOrdered) {
        throw new BadRequestException(
          ERROR_MESSAGES.INVENTORY_DEPTH.RECEIVE_EXCEEDS_ORDERED,
        );
      }

      // Update PO item received quantity
      await this.db
        .update(purchaseOrderItems)
        .set({ quantityReceived: newReceived })
        .where(eq(purchaseOrderItems.id, poItem.id));

      // Update inventory item stock
      const [item] = await this.db
        .select()
        .from(inventoryItems)
        .where(eq(inventoryItems.id, poItem.itemId));

      if (item) {
        const newStock = item.currentStock + line.quantityReceived;
        await this.db
          .update(inventoryItems)
          .set({ currentStock: newStock })
          .where(eq(inventoryItems.id, poItem.itemId));

        // Create stock transaction for the receive
        await this.db.insert(stockTransactions).values({
          id: randomUUID(),
          institutionId,
          itemId: poItem.itemId,
          transactionType: STOCK_TRANSACTION_TYPES.PURCHASE,
          quantity: line.quantityReceived,
          referenceNumber: order.orderNumber,
          purchaseOrderId: orderId,
          unitPriceInPaise: poItem.unitPriceInPaise,
          notes: dto.notes ?? null,
          createdByMemberId: createdByMember.id,
        });
      }
    }

    // Determine new PO status based on all items
    const allItems = await this.db
      .select({
        quantityOrdered: purchaseOrderItems.quantityOrdered,
        quantityReceived: purchaseOrderItems.quantityReceived,
      })
      .from(purchaseOrderItems)
      .where(eq(purchaseOrderItems.purchaseOrderId, orderId));

    const fullyReceived = allItems.every(
      (i) => i.quantityReceived >= i.quantityOrdered,
    );
    const partiallyReceived = allItems.some((i) => i.quantityReceived > 0);

    let newStatus = order.status;
    if (fullyReceived) {
      newStatus = PURCHASE_ORDER_STATUS.RECEIVED;
    } else if (partiallyReceived) {
      newStatus = PURCHASE_ORDER_STATUS.PARTIALLY_RECEIVED;
    }

    if (newStatus !== order.status) {
      await this.db
        .update(purchaseOrders)
        .set({ status: newStatus })
        .where(eq(purchaseOrders.id, orderId));
    }

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.PURCHASE_ORDER,
      entityId: orderId,
      entityLabel: order.orderNumber,
      summary: `Received goods against purchase order "${order.orderNumber}" (status: ${newStatus})`,
    });

    return { id: orderId, status: newStatus };
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private async resolveMemberNames(
    memberIds: string[],
  ): Promise<Map<string, string>> {
    if (memberIds.length === 0) return new Map();

    const results = await this.db
      .select({
        memberId: member.id,
        userName: user.name,
      })
      .from(member)
      .leftJoin(user, eq(member.userId, user.id))
      .where(
        sql`${member.id} IN (${sql.join(
          memberIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );

    const map = new Map<string, string>();
    for (const r of results) {
      map.set(r.memberId, r.userName ?? "Unknown");
    }
    return map;
  }
}
