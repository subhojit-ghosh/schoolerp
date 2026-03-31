import { z } from "zod";

export const NEEDS_ATTENTION_TYPES = {
  UNMARKED_ATTENDANCE: "unmarked_attendance",
  PENDING_LEAVE: "pending_leave",
  OVERDUE_FEES: "overdue_fees",
  ABSENCE_STREAKS: "absence_streaks",
  PENDING_ADMISSIONS: "pending_admissions",
  PENDING_EXPENSE_APPROVALS: "pending_expense_approvals",
} as const;

export const NEEDS_ATTENTION_PRIORITY = {
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
} as const;

export type NeedsAttentionItem = {
  id: string;
  type: string;
  title: string;
  count: number;
  actionUrl: string;
  priority: string;
  metadata?: Record<string, unknown>;
};

export type TrendItem = {
  label: string;
  current: number;
  previous: number;
  unit: string;
};

export const dismissItemSchema = z.object({
  itemId: z.string().min(1),
});
