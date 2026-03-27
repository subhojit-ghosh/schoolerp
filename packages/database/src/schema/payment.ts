import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

const PAYMENT_PROVIDER_ENUM = [
  "razorpay",
  "payu",
  "cashfree",
  "custom",
  "disabled",
] as const;

const PAYMENT_ORDER_STATUS_ENUM = [
  "pending",
  "paid",
  "failed",
  "expired",
] as const;

/**
 * Per-institution payment gateway configuration.
 * Credentials are stored as encrypted JSON (AES-256-GCM via delivery-crypto pattern).
 * One PG config per institution (unlike delivery which has sms + email channels).
 */
export const institutionPaymentConfig = pgTable(
  "institution_payment_config",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .unique()
      .references(() => organization.id, { onDelete: "restrict" }),
    provider: text({ enum: PAYMENT_PROVIDER_ENUM }).notNull(),
    credentials: text().notNull(), // encrypted JSON
    webhookSecret: text(), // encrypted, for verifying webhook signatures
    displayLabel: text(), // e.g. "Pay via Razorpay" — shown to parents
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("institution_payment_config_institution_idx").on(t.institutionId),
  ],
);

/**
 * Online payment orders — one per "Pay online" attempt.
 * Created before the parent is redirected to the PG checkout.
 * Confirmed (status → paid) by webhook or client-side verify.
 * On confirmation, a fee_payment record is created by the service.
 */
export const paymentOrders = pgTable(
  "payment_orders",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    feeAssignmentId: text().notNull(), // no FK cascade — we want to preserve orders even if assignment deleted
    amountInPaise: integer().notNull(),
    currency: text().notNull().default("INR"),
    status: text({ enum: PAYMENT_ORDER_STATUS_ENUM })
      .notNull()
      .default("pending"),
    provider: text({ enum: PAYMENT_PROVIDER_ENUM }).notNull(),
    // Provider-assigned order/session identifier
    externalOrderId: text(),
    // Set after successful payment
    externalPaymentId: text(),
    externalSignature: text(),
    // Provider-specific checkout data for frontend SDK (e.g. Razorpay key + orderId)
    // Stored as plain JSON (not sensitive — no credentials)
    checkoutData: text(), // JSON string
    // Populated from fee assignment for receipts / notifications
    studentName: text(),
    guardianMobile: text(),
    guardianEmail: text(),
    paidAt: timestamp(),
    failedAt: timestamp(),
    expiresAt: timestamp().notNull(),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("payment_orders_institution_idx").on(t.institutionId),
    index("payment_orders_fee_assignment_idx").on(t.feeAssignmentId),
    index("payment_orders_status_idx").on(t.status),
    uniqueIndex("payment_orders_external_order_unique_idx")
      .on(t.institutionId, t.externalOrderId)
      .where(sql`${t.externalOrderId} IS NOT NULL`),
  ],
);
