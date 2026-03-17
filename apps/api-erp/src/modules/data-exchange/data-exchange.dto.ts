import {
  DATA_EXCHANGE_ACTIONS,
  DATA_EXCHANGE_ENTITY_TYPES,
  type DataExchangeAction,
  type DataExchangeEntityType,
} from "@repo/contracts";
import { ApiProperty } from "@nestjs/swagger";

export class DataExchangeBodyRequestDto {
  @ApiProperty({
    enum: Object.values(DATA_EXCHANGE_ENTITY_TYPES),
  })
  entityType!: DataExchangeEntityType;

  @ApiProperty()
  csvContent!: string;
}

export class DataExchangeRowResultDto {
  rowNumber!: number;
  identifier!: string;

  @ApiProperty({
    enum: ["valid", "error", "imported", "failed"],
  })
  status!: "valid" | "error" | "imported" | "failed";

  @ApiProperty({
    type: String,
    isArray: true,
  })
  messages!: string[];
}

export class DataExchangePreviewSummaryDto {
  totalRows!: number;
  validRows!: number;
  invalidRows!: number;
}

export class DataExchangePreviewResultDto {
  @ApiProperty({
    enum: Object.values(DATA_EXCHANGE_ENTITY_TYPES),
  })
  entityType!: DataExchangeEntityType;

  @ApiProperty({
    type: () => DataExchangePreviewSummaryDto,
  })
  summary!: DataExchangePreviewSummaryDto;

  @ApiProperty({
    type: () => DataExchangeRowResultDto,
    isArray: true,
  })
  rows!: DataExchangeRowResultDto[];
}

export class DataExchangeExecuteSummaryDto {
  totalRows!: number;
  importedRows!: number;
  failedRows!: number;
}

export class DataExchangeExecuteResultDto {
  @ApiProperty({
    enum: Object.values(DATA_EXCHANGE_ENTITY_TYPES),
  })
  entityType!: DataExchangeEntityType;

  @ApiProperty({
    type: () => DataExchangeExecuteSummaryDto,
  })
  summary!: DataExchangeExecuteSummaryDto;

  @ApiProperty({
    type: () => DataExchangeRowResultDto,
    isArray: true,
  })
  rows!: DataExchangeRowResultDto[];
}

export class DataExchangeCapabilityDto {
  @ApiProperty({
    enum: Object.values(DATA_EXCHANGE_ENTITY_TYPES),
  })
  entityType!: DataExchangeEntityType;

  @ApiProperty({
    enum: Object.values(DATA_EXCHANGE_ACTIONS),
    isArray: true,
  })
  actions!: DataExchangeAction[];
}

export class DataExchangeCapabilitiesDto {
  @ApiProperty({
    type: () => DataExchangeCapabilityDto,
    isArray: true,
  })
  entities!: DataExchangeCapabilityDto[];
}
