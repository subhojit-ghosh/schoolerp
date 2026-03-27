export class DeliveryConfigDto {
  declare id: string;
  declare channel: string;
  declare provider: string;
  declare senderIdentity: string | null;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

export class ListDeliveryConfigsResultDto {
  declare configs: DeliveryConfigDto[];
}

export class UpsertDeliveryConfigBodyDto {
  declare provider: string;
  declare credentials: Record<string, string>;
  senderIdentity?: string;
}

export class TestDeliveryBodyDto {
  declare channel: string;
  declare recipient: string;
}

export class TestDeliveryResultDto {
  declare accepted: boolean;
  declare provider: string;
  externalId?: string | null;
}
