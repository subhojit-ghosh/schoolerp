import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  eq,
  institutionDocumentConfig,
  institutionSignatories,
  sql,
} from "@repo/database";
import { randomUUID } from "node:crypto";

type ReportCardConfig = {
  showRank: boolean;
  showRemarks: boolean;
  showAttendanceSummary: boolean;
  showGradingScale: boolean;
  showResult: boolean;
};

const DEFAULT_REPORT_CARD_CONFIG: ReportCardConfig = {
  showRank: true,
  showRemarks: true,
  showAttendanceSummary: false,
  showGradingScale: true,
  showResult: true,
};

@Injectable()
export class DocumentsService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  // ── Signatories ─────────────────────────────────────────────────────────

  async listSignatories(institutionId: string) {
    return this.database
      .select({
        id: institutionSignatories.id,
        institutionId: institutionSignatories.institutionId,
        name: institutionSignatories.name,
        designation: institutionSignatories.designation,
        sortOrder: institutionSignatories.sortOrder,
        isActive: institutionSignatories.isActive,
        createdAt: institutionSignatories.createdAt,
      })
      .from(institutionSignatories)
      .where(eq(institutionSignatories.institutionId, institutionId))
      .orderBy(asc(institutionSignatories.sortOrder));
  }

  async createSignatory(
    institutionId: string,
    payload: { name: string; designation: string; sortOrder?: number },
  ) {
    const id = randomUUID();
    await this.database.insert(institutionSignatories).values({
      id,
      institutionId,
      name: payload.name.trim(),
      designation: payload.designation.trim(),
      sortOrder: payload.sortOrder ?? 0,
    });
    return { id };
  }

  async updateSignatory(
    institutionId: string,
    signatoryId: string,
    payload: {
      name?: string;
      designation?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const [existing] = await this.database
      .select({ id: institutionSignatories.id })
      .from(institutionSignatories)
      .where(
        and(
          eq(institutionSignatories.id, signatoryId),
          eq(institutionSignatories.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!existing) {
      throw new NotFoundException("Signatory not found.");
    }

    const updates: Partial<{
      name: string;
      designation: string;
      sortOrder: number;
      isActive: boolean;
    }> = {};

    if (payload.name !== undefined) updates.name = payload.name.trim();
    if (payload.designation !== undefined)
      updates.designation = payload.designation.trim();
    if (payload.sortOrder !== undefined) updates.sortOrder = payload.sortOrder;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    if (Object.keys(updates).length > 0) {
      await this.database
        .update(institutionSignatories)
        .set(updates)
        .where(eq(institutionSignatories.id, signatoryId));
    }

    return { id: signatoryId };
  }

  // ── Document config ─────────────────────────────────────────────────────

  async getDocumentConfig(institutionId: string) {
    const [config] = await this.database
      .select({
        id: institutionDocumentConfig.id,
        institutionId: institutionDocumentConfig.institutionId,
        receiptPrefix: institutionDocumentConfig.receiptPrefix,
        receiptNextNumber: institutionDocumentConfig.receiptNextNumber,
        receiptPadLength: institutionDocumentConfig.receiptPadLength,
        reportCardConfig: institutionDocumentConfig.reportCardConfig,
      })
      .from(institutionDocumentConfig)
      .where(eq(institutionDocumentConfig.institutionId, institutionId))
      .limit(1);

    if (!config) {
      return {
        receiptPrefix: "RCT",
        receiptNextNumber: 1,
        receiptPadLength: 6,
        reportCardConfig: DEFAULT_REPORT_CARD_CONFIG,
      };
    }

    return {
      receiptPrefix: config.receiptPrefix,
      receiptNextNumber: config.receiptNextNumber,
      receiptPadLength: config.receiptPadLength,
      reportCardConfig:
        (config.reportCardConfig as ReportCardConfig) ??
        DEFAULT_REPORT_CARD_CONFIG,
    };
  }

  async updateDocumentConfig(
    institutionId: string,
    payload: {
      receiptPrefix?: string;
      receiptNextNumber?: number;
      receiptPadLength?: number;
      reportCardConfig?: ReportCardConfig;
    },
  ) {
    const [existing] = await this.database
      .select({ id: institutionDocumentConfig.id })
      .from(institutionDocumentConfig)
      .where(eq(institutionDocumentConfig.institutionId, institutionId))
      .limit(1);

    if (existing) {
      const updates: Record<string, unknown> = {};
      if (payload.receiptPrefix !== undefined)
        updates.receiptPrefix = payload.receiptPrefix;
      if (payload.receiptNextNumber !== undefined)
        updates.receiptNextNumber = payload.receiptNextNumber;
      if (payload.receiptPadLength !== undefined)
        updates.receiptPadLength = payload.receiptPadLength;
      if (payload.reportCardConfig !== undefined)
        updates.reportCardConfig = payload.reportCardConfig;

      if (Object.keys(updates).length > 0) {
        await this.database
          .update(institutionDocumentConfig)
          .set(updates)
          .where(eq(institutionDocumentConfig.id, existing.id));
      }
    } else {
      await this.database.insert(institutionDocumentConfig).values({
        id: randomUUID(),
        institutionId,
        receiptPrefix: payload.receiptPrefix ?? "RCT",
        receiptNextNumber: payload.receiptNextNumber ?? 1,
        receiptPadLength: payload.receiptPadLength ?? 6,
        reportCardConfig:
          payload.reportCardConfig ?? DEFAULT_REPORT_CARD_CONFIG,
      });
    }

    return this.getDocumentConfig(institutionId);
  }

  // ── Receipt numbering ─────────────────────────────────────────────────

  async getNextReceiptNumber(institutionId: string): Promise<string> {
    // Ensure config row exists
    const [existing] = await this.database
      .select({ id: institutionDocumentConfig.id })
      .from(institutionDocumentConfig)
      .where(eq(institutionDocumentConfig.institutionId, institutionId))
      .limit(1);

    if (!existing) {
      await this.database.insert(institutionDocumentConfig).values({
        id: randomUUID(),
        institutionId,
      });
    }

    // Atomic increment and return
    const [row] = await this.database
      .update(institutionDocumentConfig)
      .set({
        receiptNextNumber: sql`${institutionDocumentConfig.receiptNextNumber} + 1`,
      })
      .where(eq(institutionDocumentConfig.institutionId, institutionId))
      .returning({
        currentNumber: sql<number>`${institutionDocumentConfig.receiptNextNumber} - 1`,
        prefix: institutionDocumentConfig.receiptPrefix,
        padLength: institutionDocumentConfig.receiptPadLength,
      });

    const num = row.currentNumber;
    const prefix = row.prefix;
    const padLength = row.padLength;

    return `${prefix}-${String(num).padStart(padLength, "0")}`;
  }
}
