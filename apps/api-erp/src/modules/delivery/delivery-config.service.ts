import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DATABASE } from "@repo/backend-core";
import {
  and,
  eq,
  institutionDeliveryConfig,
  type AppDatabase,
} from "@repo/database";
import { DELIVERY_PROVIDERS, type DeliveryChannelType } from "@repo/contracts";

type DeliveryProviderEnum = typeof institutionDeliveryConfig.$inferInsert.provider;
type DeliveryChannelEnum = typeof institutionDeliveryConfig.$inferInsert.channel;
import { randomUUID } from "node:crypto";
import { decryptCredentials, encryptCredentials } from "./delivery-crypto";
import {
  Msg91SmsProvider,
  TwilioSmsProvider,
  ResendEmailProvider,
  SendGridEmailProvider,
} from "./providers";
import type { EmailDeliveryProvider, SmsDeliveryProvider } from "./delivery.types";

export type DeliveryConfigRecord = {
  id: string;
  institutionId: string;
  channel: string;
  provider: string;
  senderIdentity: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertDeliveryConfigInput = {
  institutionId: string;
  channel: DeliveryChannelType;
  provider: string;
  credentials: Record<string, string>;
  senderIdentity?: string | null;
};

@Injectable()
export class DeliveryConfigService {
  private readonly logger = new Logger(DeliveryConfigService.name);

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly configService: ConfigService,
  ) {}

  async getConfig(
    institutionId: string,
    channel: DeliveryChannelType,
  ): Promise<DeliveryConfigRecord | null> {
    const rows = await this.db
      .select({
        id: institutionDeliveryConfig.id,
        institutionId: institutionDeliveryConfig.institutionId,
        channel: institutionDeliveryConfig.channel,
        provider: institutionDeliveryConfig.provider,
        senderIdentity: institutionDeliveryConfig.senderIdentity,
        isActive: institutionDeliveryConfig.isActive,
        createdAt: institutionDeliveryConfig.createdAt,
        updatedAt: institutionDeliveryConfig.updatedAt,
      })
      .from(institutionDeliveryConfig)
      .where(
        and(
          eq(institutionDeliveryConfig.institutionId, institutionId),
          eq(institutionDeliveryConfig.channel, channel),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  async listConfigs(
    institutionId: string,
  ): Promise<DeliveryConfigRecord[]> {
    return this.db
      .select({
        id: institutionDeliveryConfig.id,
        institutionId: institutionDeliveryConfig.institutionId,
        channel: institutionDeliveryConfig.channel,
        provider: institutionDeliveryConfig.provider,
        senderIdentity: institutionDeliveryConfig.senderIdentity,
        isActive: institutionDeliveryConfig.isActive,
        createdAt: institutionDeliveryConfig.createdAt,
        updatedAt: institutionDeliveryConfig.updatedAt,
      })
      .from(institutionDeliveryConfig)
      .where(eq(institutionDeliveryConfig.institutionId, institutionId));
  }

  async upsertConfig(input: UpsertDeliveryConfigInput): Promise<DeliveryConfigRecord> {
    const encryptionKey = this.getEncryptionKey();
    const encrypted = encryptCredentials(
      JSON.stringify(input.credentials),
      encryptionKey,
    );

    const existing = await this.getConfig(input.institutionId, input.channel);

    if (existing) {
      const [updated] = await this.db
        .update(institutionDeliveryConfig)
        .set({
          provider: input.provider as DeliveryProviderEnum,
          credentials: encrypted,
          senderIdentity: input.senderIdentity ?? null,
          isActive: true,
        })
        .where(eq(institutionDeliveryConfig.id, existing.id))
        .returning({
          id: institutionDeliveryConfig.id,
          institutionId: institutionDeliveryConfig.institutionId,
          channel: institutionDeliveryConfig.channel,
          provider: institutionDeliveryConfig.provider,
          senderIdentity: institutionDeliveryConfig.senderIdentity,
          isActive: institutionDeliveryConfig.isActive,
          createdAt: institutionDeliveryConfig.createdAt,
          updatedAt: institutionDeliveryConfig.updatedAt,
        });

      return updated;
    }

    const [created] = await this.db
      .insert(institutionDeliveryConfig)
      .values({
        id: randomUUID(),
        institutionId: input.institutionId,
        channel: input.channel as DeliveryChannelEnum,
        provider: input.provider as DeliveryProviderEnum,
        credentials: encrypted,
        senderIdentity: input.senderIdentity ?? null,
        isActive: true,
      })
      .returning({
        id: institutionDeliveryConfig.id,
        institutionId: institutionDeliveryConfig.institutionId,
        channel: institutionDeliveryConfig.channel,
        provider: institutionDeliveryConfig.provider,
        senderIdentity: institutionDeliveryConfig.senderIdentity,
        isActive: institutionDeliveryConfig.isActive,
        createdAt: institutionDeliveryConfig.createdAt,
        updatedAt: institutionDeliveryConfig.updatedAt,
      });

    return created;
  }

  async deactivateConfig(
    institutionId: string,
    channel: DeliveryChannelType,
  ): Promise<void> {
    await this.db
      .update(institutionDeliveryConfig)
      .set({ isActive: false })
      .where(
        and(
          eq(institutionDeliveryConfig.institutionId, institutionId),
          eq(institutionDeliveryConfig.channel, channel),
        ),
      );
  }

  /**
   * Resolve an institution-specific SMS provider from stored config.
   * Returns null if no active config exists for this institution.
   */
  resolveInstitutionSmsProvider(
    provider: string,
    encryptedCredentials: string,
  ): SmsDeliveryProvider | null {
    const credentials = this.decryptCredentialsJson(encryptedCredentials);

    switch (provider) {
      case DELIVERY_PROVIDERS.MSG91:
        return new Msg91SmsProvider(credentials as any);
      case DELIVERY_PROVIDERS.TWILIO:
        return new TwilioSmsProvider(credentials as any);
      default:
        this.logger.warn(`Unsupported institution SMS provider: ${provider}`);
        return null;
    }
  }

  /**
   * Resolve an institution-specific email provider from stored config.
   * Returns null if no active config exists for this institution.
   */
  resolveInstitutionEmailProvider(
    provider: string,
    encryptedCredentials: string,
  ): EmailDeliveryProvider | null {
    const credentials = this.decryptCredentialsJson(encryptedCredentials);

    switch (provider) {
      case DELIVERY_PROVIDERS.RESEND:
        return new ResendEmailProvider(credentials as any);
      case DELIVERY_PROVIDERS.SENDGRID:
        return new SendGridEmailProvider(credentials as any);
      default:
        this.logger.warn(`Unsupported institution email provider: ${provider}`);
        return null;
    }
  }

  /**
   * Get the raw encrypted credentials for an active config.
   * Used internally by DeliveryService for per-institution provider resolution.
   */
  async getActiveConfigWithCredentials(
    institutionId: string,
    channel: DeliveryChannelType,
  ): Promise<{
    provider: string;
    credentials: string;
    senderIdentity: string | null;
  } | null> {
    const rows = await this.db
      .select({
        provider: institutionDeliveryConfig.provider,
        credentials: institutionDeliveryConfig.credentials,
        senderIdentity: institutionDeliveryConfig.senderIdentity,
      })
      .from(institutionDeliveryConfig)
      .where(
        and(
          eq(institutionDeliveryConfig.institutionId, institutionId),
          eq(institutionDeliveryConfig.channel, channel),
          eq(institutionDeliveryConfig.isActive, true),
        ),
      )
      .limit(1);

    return rows[0] ?? null;
  }

  private decryptCredentialsJson(
    encryptedCredentials: string,
  ): Record<string, string> {
    const encryptionKey = this.getEncryptionKey();
    const decrypted = decryptCredentials(encryptedCredentials, encryptionKey);

    return JSON.parse(decrypted) as Record<string, string>;
  }

  private getEncryptionKey(): string {
    const key = this.configService.get<string>("delivery.credentialsKey");

    if (!key) {
      throw new Error(
        "DELIVERY_CREDENTIALS_KEY must be set to encrypt/decrypt provider credentials",
      );
    }

    return key;
  }
}
