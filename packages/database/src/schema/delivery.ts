import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { organization } from "./auth";

const DELIVERY_CHANNEL_ENUM = ["sms", "email"] as const;
const DELIVERY_PROVIDER_ENUM = [
  "msg91",
  "twilio",
  "resend",
  "sendgrid",
  "smtp",
  "disabled",
] as const;

export const institutionDeliveryConfig = pgTable(
  "institution_delivery_config",
  {
    id: text().primaryKey(),
    institutionId: text()
      .notNull()
      .references(() => organization.id, { onDelete: "restrict" }),
    channel: text({ enum: DELIVERY_CHANNEL_ENUM }).notNull(),
    provider: text({ enum: DELIVERY_PROVIDER_ENUM }).notNull(),
    credentials: text().notNull(), // encrypted JSON
    senderIdentity: text(), // from number/email for display
    isActive: boolean().notNull().default(true),
    createdAt: timestamp().notNull().defaultNow(),
    updatedAt: timestamp()
      .notNull()
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date()),
  },
  (t) => [
    index("institution_delivery_config_institution_idx").on(t.institutionId),
    uniqueIndex(
      "institution_delivery_config_institution_channel_unique_idx",
    ).on(t.institutionId, t.channel),
  ],
);
