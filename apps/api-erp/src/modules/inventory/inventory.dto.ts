import { ApiProperty } from "@nestjs/swagger";

// ── Categories ───────────────────────────────────────────────────────────────

export class CreateCategoryBodyDto {
  name!: string;
  description?: string;
}

export class UpdateCategoryBodyDto {
  name?: string;

  @ApiProperty({ nullable: true })
  description?: string | null;
}

export class UpdateCategoryStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class CategoryDto {
  id!: string;
  name!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  createdAt!: string;
}

export class CategoryListResultDto {
  rows!: CategoryDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListCategoriesQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive", "deleted"], required: false })
  status?: "active" | "inactive" | "deleted";

  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "createdAt"], required: false })
  sort?: "name" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Items ────────────────────────────────────────────────────────────────────

export class CreateItemBodyDto {
  name!: string;
  categoryId!: string;
  sku?: string;

  @ApiProperty({ enum: ["piece", "box", "pack", "set", "kg", "liter"] })
  unit?: "piece" | "box" | "pack" | "set" | "kg" | "liter";

  minimumStock?: number;
  location?: string;
  purchasePriceInPaise?: number;
}

export class UpdateItemBodyDto {
  name?: string;
  categoryId?: string;

  @ApiProperty({ nullable: true })
  sku?: string | null;

  @ApiProperty({ enum: ["piece", "box", "pack", "set", "kg", "liter"], required: false })
  unit?: "piece" | "box" | "pack" | "set" | "kg" | "liter";

  minimumStock?: number;

  @ApiProperty({ nullable: true })
  location?: string | null;

  @ApiProperty({ nullable: true })
  purchasePriceInPaise?: number | null;
}

export class UpdateItemStatusBodyDto {
  @ApiProperty({ enum: ["active", "inactive"] })
  status!: "active" | "inactive";
}

export class ItemDto {
  id!: string;
  name!: string;
  categoryId!: string;
  categoryName!: string;

  @ApiProperty({ nullable: true })
  sku!: string | null;

  @ApiProperty({ enum: ["piece", "box", "pack", "set", "kg", "liter"] })
  unit!: string;

  currentStock!: number;
  minimumStock!: number;

  @ApiProperty({ nullable: true })
  location!: string | null;

  @ApiProperty({ nullable: true })
  purchasePriceInPaise!: number | null;

  @ApiProperty({ enum: ["active", "inactive", "deleted"] })
  status!: "active" | "inactive" | "deleted";

  createdAt!: string;
}

export class ItemDetailDto extends ItemDto {
  updatedAt!: string;
}

export class ItemListResultDto {
  rows!: ItemDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListItemsQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["active", "inactive", "deleted"], required: false })
  status?: "active" | "inactive" | "deleted";

  categoryId?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "currentStock", "createdAt"], required: false })
  sort?: "name" | "currentStock" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

// ── Stock Transactions ───────────────────────────────────────────────────────

export class CreateStockTransactionBodyDto {
  itemId!: string;

  @ApiProperty({ enum: ["purchase", "issue", "return", "adjustment"] })
  transactionType!: "purchase" | "issue" | "return" | "adjustment";

  quantity!: number;
  referenceNumber?: string;
  issuedToMembershipId?: string;
  notes?: string;
}

export class StockTransactionDto {
  id!: string;
  itemId!: string;
  itemName!: string;

  @ApiProperty({ enum: ["purchase", "issue", "return", "adjustment"] })
  transactionType!: string;

  quantity!: number;

  @ApiProperty({ nullable: true })
  referenceNumber!: string | null;

  @ApiProperty({ nullable: true })
  issuedToMembershipId!: string | null;

  @ApiProperty({ nullable: true })
  issuedToName!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;

  createdByMemberId!: string;
  createdByName!: string;
  createdAt!: string;
}

export class StockTransactionListResultDto {
  rows!: StockTransactionDto[];
  total!: number;
  page!: number;
  pageSize!: number;
  pageCount!: number;
}

export class ListTransactionsQueryParamsDto {
  q?: string;

  @ApiProperty({ enum: ["purchase", "issue", "return", "adjustment"], required: false })
  transactionType?: "purchase" | "issue" | "return" | "adjustment";

  itemId?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["createdAt", "quantity"], required: false })
  sort?: "createdAt" | "quantity";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

export class ListItemTransactionsQueryParamsDto {
  q?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["createdAt", "quantity"], required: false })
  sort?: "createdAt" | "quantity";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}

export class ListLowStockQueryParamsDto {
  q?: string;
  page?: number;
  limit?: number;

  @ApiProperty({ enum: ["name", "currentStock", "createdAt"], required: false })
  sort?: "name" | "currentStock" | "createdAt";

  @ApiProperty({ enum: ["asc", "desc"], required: false })
  order?: "asc" | "desc";
}
