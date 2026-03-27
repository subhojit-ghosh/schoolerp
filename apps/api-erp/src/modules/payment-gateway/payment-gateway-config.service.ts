import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DATABASE } from "@repo/backend-core";
import {
  eq,
  institutionPaymentConfig,
  type AppDatabase,
} from "@repo/database";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@repo/contracts";
import { randomUUID } from "node:crypto";
import {
  decryptPaymentCredentials,
  encryptPaymentCredentials,
} from "./payment-gateway-crypto";
import {
  RazorpayProvider,
  CashfreeProvider,
  PayUProvider,
  CustomProvider,
  DisabledProvider,
  isRazorpayCredentials,
  isCashfreeCredentials,
  isPayUCredentials,
  isCustomCredentials,
} from "./providers";
import type { PaymentGatewayProvider } from "./payment-gateway.types";

export type PaymentConfigRecord = {
  id: string;
  institutionId: string;
  provider: string;
  displayLabel: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertPaymentConfigInput = {
  institutionId: string;
  provider: PaymentProvider;
  credentials: Record<string, string>;
  displayLabel?: string | null;
};

@Injectable()
export class PaymentGatewayConfigService {
  private readonly logger = new Logger(PaymentGatewayConfigService.name);

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly configService: ConfigService,
  ) {}

  async getConfig(institutionId: string): Promise<PaymentConfigRecord | null> {
    const rows = await this.db
      .select({
        id: institutionPaymentConfig.id,
        institutionId: institutionPaymentConfig.institutionId,
        provider: institutionPaymentConfig.provider,
        displayLabel: institutionPaymentConfig.displayLabel,
        isActive: institutionPaymentConfig.isActive,
        createdAt: institutionPaymentConfig.createdAt,
        updatedAt: institutionPaymentConfig.updatedAt,
      })
      .from(institutionPaymentConfig)
      .where(eq(institutionPaymentConfig.institutionId, institutionId))
      .limit(1);

    return rows[0] ?? null;
  }

  async upsertConfig(
    input: UpsertPaymentConfigInput,
  ): Promise<PaymentConfigRecord> {
    const encryptionKey = this.getEncryptionKey();
    const encrypted = encryptPaymentCredentials(
      JSON.stringify(input.credentials),
      encryptionKey,
    );

    const existing = await this.getConfig(input.institutionId);

    if (existing) {
      const [updated] = await this.db
        .update(institutionPaymentConfig)
        .set({
          provider: input.provider,
          credentials: encrypted,
          displayLabel: input.displayLabel ?? null,
          isActive: true,
        })
        .where(eq(institutionPaymentConfig.id, existing.id))
        .returning({
          id: institutionPaymentConfig.id,
          institutionId: institutionPaymentConfig.institutionId,
          provider: institutionPaymentConfig.provider,
          displayLabel: institutionPaymentConfig.displayLabel,
          isActive: institutionPaymentConfig.isActive,
          createdAt: institutionPaymentConfig.createdAt,
          updatedAt: institutionPaymentConfig.updatedAt,
        });

      return updated;
    }

    const [created] = await this.db
      .insert(institutionPaymentConfig)
      .values({
        id: randomUUID(),
        institutionId: input.institutionId,
        provider: input.provider,
        credentials: encrypted,
        displayLabel: input.displayLabel ?? null,
        isActive: true,
      })
      .returning({
        id: institutionPaymentConfig.id,
        institutionId: institutionPaymentConfig.institutionId,
        provider: institutionPaymentConfig.provider,
        displayLabel: institutionPaymentConfig.displayLabel,
        isActive: institutionPaymentConfig.isActive,
        createdAt: institutionPaymentConfig.createdAt,
        updatedAt: institutionPaymentConfig.updatedAt,
      });

    return created;
  }

  async deactivateConfig(institutionId: string): Promise<void> {
    await this.db
      .update(institutionPaymentConfig)
      .set({ isActive: false })
      .where(eq(institutionPaymentConfig.institutionId, institutionId));
  }

  /**
   * Resolve the active payment provider for an institution.
   * Returns a DisabledProvider if no active config is found.
   */
  async resolveProvider(
    institutionId: string,
  ): Promise<PaymentGatewayProvider> {
    const rows = await this.db
      .select({
        provider: institutionPaymentConfig.provider,
        credentials: institutionPaymentConfig.credentials,
      })
      .from(institutionPaymentConfig)
      .where(eq(institutionPaymentConfig.institutionId, institutionId))
      .limit(1);

    const row = rows[0];

    if (!row || !row.credentials) {
      return new DisabledProvider();
    }

    const encryptionKey = this.getEncryptionKey();
    let credentials: Record<string, unknown>;

    try {
      credentials = JSON.parse(
        decryptPaymentCredentials(row.credentials, encryptionKey),
      ) as Record<string, unknown>;
    } catch (err) {
      this.logger.error(
        `Failed to decrypt payment credentials for institution ${institutionId}: ${String(err)}`,
      );
      return new DisabledProvider();
    }

    switch (row.provider as PaymentProvider) {
      case PAYMENT_PROVIDERS.RAZORPAY:
        if (isRazorpayCredentials(credentials)) {
          return new RazorpayProvider(credentials);
        }
        break;
      case PAYMENT_PROVIDERS.CASHFREE:
        if (isCashfreeCredentials(credentials)) {
          return new CashfreeProvider(credentials);
        }
        break;
      case PAYMENT_PROVIDERS.PAYU:
        if (isPayUCredentials(credentials)) {
          return new PayUProvider(credentials);
        }
        break;
      case PAYMENT_PROVIDERS.CUSTOM:
        if (isCustomCredentials(credentials)) {
          return new CustomProvider(credentials);
        }
        break;
      case PAYMENT_PROVIDERS.DISABLED:
        return new DisabledProvider();
    }

    this.logger.warn(
      `Invalid credentials shape for provider ${row.provider} (institution ${institutionId}) — returning disabled`,
    );
    return new DisabledProvider();
  }

  private getEncryptionKey(): string {
    const key = this.configService.get<string>("payment.credentialsKey");

    if (!key) {
      throw new Error(
        "PAYMENT_CREDENTIALS_KEY must be set to encrypt/decrypt payment provider credentials",
      );
    }

    return key;
  }
}
