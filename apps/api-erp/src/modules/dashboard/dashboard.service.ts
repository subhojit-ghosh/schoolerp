import { Inject, Injectable, Logger } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  ATTENDANCE_STATUSES,
  EXPENSE_STATUS,
  FEE_ASSIGNMENT_STATUSES,
  PERMISSIONS,
  type PermissionSlug,
} from "@repo/contracts";
import {
  admissionApplications,
  and,
  attendanceRecords,
  classSections,
  count,
  eq,
  expenses,
  feeAssignments,
  leaveApplications,
  lte,
  ne,
  schoolClasses,
  sql,
  students,
  sum,
  type AppDatabase,
} from "@repo/database";
import {
  NEEDS_ATTENTION_PRIORITY,
  NEEDS_ATTENTION_TYPES,
  type NeedsAttentionItem,
  type TrendItem,
} from "./dashboard.schemas";

// In-memory dismiss store keyed by "userId:itemId"
const dismissedItems = new Map<string, Set<string>>();

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async getNeedsAttention(
    institutionId: string,
    userId: string,
    permissions: Set<PermissionSlug>,
  ): Promise<{ items: NeedsAttentionItem[] }> {
    const items: NeedsAttentionItem[] = [];
    const today = new Date().toISOString().slice(0, 10);

    // Build items in parallel where possible
    const promises: Promise<void>[] = [];

    // 1. Unmarked attendance — classes with no attendance record for today
    if (
      permissions.has(PERMISSIONS.ATTENDANCE_READ) ||
      permissions.has(PERMISSIONS.ATTENDANCE_WRITE)
    ) {
      promises.push(
        this.getUnmarkedAttendance(institutionId, today).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    // 2. Pending leave applications
    if (permissions.has(PERMISSIONS.LEAVE_MANAGE)) {
      promises.push(
        this.getPendingLeave(institutionId).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    // 3. Overdue fee assignments
    if (
      permissions.has(PERMISSIONS.FEES_READ) ||
      permissions.has(PERMISSIONS.FEES_MANAGE)
    ) {
      promises.push(
        this.getOverdueFees(institutionId, today).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    // 4. Absence streaks (3+ consecutive days)
    if (
      permissions.has(PERMISSIONS.ATTENDANCE_READ) ||
      permissions.has(PERMISSIONS.ATTENDANCE_WRITE)
    ) {
      promises.push(
        this.getAbsenceStreaks(institutionId).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    // 5. Pending admission applications
    if (
      permissions.has(PERMISSIONS.ADMISSIONS_READ) ||
      permissions.has(PERMISSIONS.ADMISSIONS_MANAGE)
    ) {
      promises.push(
        this.getPendingAdmissions(institutionId).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    // 6. Pending expense approvals
    if (permissions.has(PERMISSIONS.EXPENSES_APPROVE)) {
      promises.push(
        this.getPendingExpenseApprovals(institutionId).then((item) => {
          if (item) items.push(item);
        }),
      );
    }

    await Promise.all(promises);

    // Filter out dismissed items
    const userDismissed = dismissedItems.get(userId);
    const filtered = userDismissed
      ? items.filter((item) => !userDismissed.has(item.id))
      : items;

    // Sort by priority: high first, then medium, then low
    const priorityOrder: Record<string, number> = {
      [NEEDS_ATTENTION_PRIORITY.HIGH]: 0,
      [NEEDS_ATTENTION_PRIORITY.MEDIUM]: 1,
      [NEEDS_ATTENTION_PRIORITY.LOW]: 2,
    };
    filtered.sort(
      (a, b) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2),
    );

    return { items: filtered };
  }

  async getTrends(institutionId: string): Promise<{ trends: TrendItem[] }> {
    const trends: TrendItem[] = [];
    const now = new Date();

    // Attendance rate: this week vs last week
    try {
      const thisWeekStart = getWeekStart(now);
      const lastWeekStart = new Date(thisWeekStart);
      lastWeekStart.setDate(lastWeekStart.getDate() - 7);

      const [thisWeekRate, lastWeekRate] = await Promise.all([
        this.getAttendanceRate(institutionId, thisWeekStart, now),
        this.getAttendanceRate(institutionId, lastWeekStart, thisWeekStart),
      ]);

      trends.push({
        label: "Attendance Rate",
        current: thisWeekRate,
        previous: lastWeekRate,
        unit: "percent",
      });
    } catch (error) {
      this.logger.warn(`Failed to compute attendance trend: ${String(error)}`);
    }

    // Fee collection: this month vs total assigned
    try {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .slice(0, 10);

      const [collected, assigned] = await Promise.all([
        this.getFeeCollectedThisMonth(institutionId, monthStart, monthEnd),
        this.getFeeTotalAssigned(institutionId),
      ]);

      const collectionRate =
        assigned > 0 ? Math.round((collected / assigned) * 100) : 0;

      trends.push({
        label: "Fee Collection",
        current: collectionRate,
        previous: 100, // target is 100%
        unit: "percent",
      });
    } catch (error) {
      this.logger.warn(`Failed to compute fee trend: ${String(error)}`);
    }

    // Student enrollment: current count
    try {
      const [currentRow] = await this.db
        .select({ count: count() })
        .from(students)
        .where(
          and(
            eq(students.institutionId, institutionId),
            sql`${students.deletedAt} IS NULL`,
          ),
        );

      trends.push({
        label: "Student Enrollment",
        current: currentRow?.count ?? 0,
        previous: 0, // no historical comparison without tracking
        unit: "count",
      });
    } catch (error) {
      this.logger.warn(`Failed to compute enrollment trend: ${String(error)}`);
    }

    return { trends };
  }

  dismissItem(userId: string, itemId: string): { dismissed: boolean } {
    let userSet = dismissedItems.get(userId);

    if (!userSet) {
      userSet = new Set();
      dismissedItems.set(userId, userSet);
    }

    userSet.add(itemId);
    return { dismissed: true };
  }

  // ── Private query helpers ─────────────────────────────────────────────

  private async getUnmarkedAttendance(
    institutionId: string,
    today: string,
  ): Promise<NeedsAttentionItem | null> {
    // Count active class-sections that have NO attendance record today
    const [totalSections] = await this.db
      .select({ count: count() })
      .from(classSections)
      .innerJoin(schoolClasses, eq(classSections.classId, schoolClasses.id))
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          eq(classSections.status, "active"),
          eq(schoolClasses.status, "active"),
        ),
      );

    const [markedSections] = await this.db
      .select({
        count: sql<number>`COUNT(DISTINCT (${attendanceRecords.classId} || '-' || ${attendanceRecords.sectionId}))`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.attendanceDate, today),
        ),
      );

    const totalCount = totalSections?.count ?? 0;
    const markedCount = Number(markedSections?.count ?? 0);
    const unmarked = totalCount - markedCount;

    if (unmarked <= 0) return null;

    return {
      id: NEEDS_ATTENTION_TYPES.UNMARKED_ATTENDANCE,
      type: NEEDS_ATTENTION_TYPES.UNMARKED_ATTENDANCE,
      title: "Unmarked Attendance",
      count: unmarked,
      actionUrl: "/attendance",
      priority: NEEDS_ATTENTION_PRIORITY.HIGH,
      metadata: { totalSections: totalCount, markedSections: markedCount },
    };
  }

  private async getPendingLeave(
    institutionId: string,
  ): Promise<NeedsAttentionItem | null> {
    const [row] = await this.db
      .select({ count: count() })
      .from(leaveApplications)
      .where(
        and(
          eq(leaveApplications.institutionId, institutionId),
          eq(leaveApplications.status, "pending"),
        ),
      );

    const pendingCount = row?.count ?? 0;

    if (pendingCount === 0) return null;

    return {
      id: NEEDS_ATTENTION_TYPES.PENDING_LEAVE,
      type: NEEDS_ATTENTION_TYPES.PENDING_LEAVE,
      title: "Pending Leave Applications",
      count: pendingCount,
      actionUrl: "/leave",
      priority: NEEDS_ATTENTION_PRIORITY.MEDIUM,
    };
  }

  private async getOverdueFees(
    institutionId: string,
    today: string,
  ): Promise<NeedsAttentionItem | null> {
    const [row] = await this.db
      .select({
        count: count(),
        totalAmountInPaise: sum(feeAssignments.assignedAmountInPaise),
      })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          ne(feeAssignments.status, FEE_ASSIGNMENT_STATUSES.PAID),
          lte(feeAssignments.dueDate, today),
          sql`${feeAssignments.deletedAt} IS NULL`,
        ),
      );

    const overdueCount = row?.count ?? 0;

    if (overdueCount === 0) return null;

    const totalAmount = Number(row?.totalAmountInPaise ?? 0);

    return {
      id: NEEDS_ATTENTION_TYPES.OVERDUE_FEES,
      type: NEEDS_ATTENTION_TYPES.OVERDUE_FEES,
      title: "Overdue Fee Assignments",
      count: overdueCount,
      actionUrl: "/fees",
      priority: NEEDS_ATTENTION_PRIORITY.HIGH,
      metadata: { totalAmountInPaise: totalAmount },
    };
  }

  private async getAbsenceStreaks(
    institutionId: string,
  ): Promise<NeedsAttentionItem | null> {
    // Find students with 3+ consecutive absences ending today or recently
    // Uses a simplified approach: count students absent on the last 3 school days
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 5); // look back 5 calendar days to cover weekends

    const result = await this.db
      .select({
        studentId: attendanceRecords.studentId,
        absentDays: count(),
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.status, ATTENDANCE_STATUSES.ABSENT),
          sql`${attendanceRecords.attendanceDate} >= ${threeDaysAgo.toISOString().slice(0, 10)}`,
        ),
      )
      .groupBy(attendanceRecords.studentId)
      .having(sql`COUNT(*) >= 3`);

    const streakCount = result.length;

    if (streakCount === 0) return null;

    return {
      id: NEEDS_ATTENTION_TYPES.ABSENCE_STREAKS,
      type: NEEDS_ATTENTION_TYPES.ABSENCE_STREAKS,
      title: "Students with 3+ Consecutive Absences",
      count: streakCount,
      actionUrl: "/attendance",
      priority: NEEDS_ATTENTION_PRIORITY.HIGH,
    };
  }

  private async getPendingAdmissions(
    institutionId: string,
  ): Promise<NeedsAttentionItem | null> {
    const [row] = await this.db
      .select({ count: count() })
      .from(admissionApplications)
      .where(
        and(
          eq(admissionApplications.institutionId, institutionId),
          eq(admissionApplications.status, "submitted"),
          sql`${admissionApplications.deletedAt} IS NULL`,
        ),
      );

    const pendingCount = row?.count ?? 0;

    if (pendingCount === 0) return null;

    return {
      id: NEEDS_ATTENTION_TYPES.PENDING_ADMISSIONS,
      type: NEEDS_ATTENTION_TYPES.PENDING_ADMISSIONS,
      title: "Pending Admission Applications",
      count: pendingCount,
      actionUrl: "/admissions",
      priority: NEEDS_ATTENTION_PRIORITY.MEDIUM,
    };
  }

  private async getPendingExpenseApprovals(
    institutionId: string,
  ): Promise<NeedsAttentionItem | null> {
    const [row] = await this.db
      .select({ count: count() })
      .from(expenses)
      .where(
        and(
          eq(expenses.institutionId, institutionId),
          eq(expenses.status, EXPENSE_STATUS.SUBMITTED),
        ),
      );

    const pendingCount = row?.count ?? 0;

    if (pendingCount === 0) return null;

    return {
      id: NEEDS_ATTENTION_TYPES.PENDING_EXPENSE_APPROVALS,
      type: NEEDS_ATTENTION_TYPES.PENDING_EXPENSE_APPROVALS,
      title: "Pending Expense Approvals",
      count: pendingCount,
      actionUrl: "/expenses",
      priority: NEEDS_ATTENTION_PRIORITY.LOW,
    };
  }

  private async getAttendanceRate(
    institutionId: string,
    from: Date,
    to: Date,
  ): Promise<number> {
    const fromStr = from.toISOString().slice(0, 10);
    const toStr = to.toISOString().slice(0, 10);

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          sql`${attendanceRecords.attendanceDate} >= ${fromStr}`,
          sql`${attendanceRecords.attendanceDate} < ${toStr}`,
        ),
      );

    const [presentRow] = await this.db
      .select({ count: count() })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          sql`${attendanceRecords.attendanceDate} >= ${fromStr}`,
          sql`${attendanceRecords.attendanceDate} < ${toStr}`,
          ne(attendanceRecords.status, ATTENDANCE_STATUSES.ABSENT),
        ),
      );

    const total = totalRow?.count ?? 0;
    const present = presentRow?.count ?? 0;

    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  private async getFeeCollectedThisMonth(
    institutionId: string,
    _monthStart: string,
    _monthEnd: string,
  ): Promise<number> {
    // Count paid assignments this month
    const [row] = await this.db
      .select({
        totalPaise: sum(feeAssignments.assignedAmountInPaise),
      })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          eq(feeAssignments.status, FEE_ASSIGNMENT_STATUSES.PAID),
          sql`${feeAssignments.deletedAt} IS NULL`,
        ),
      );

    return Number(row?.totalPaise ?? 0);
  }

  private async getFeeTotalAssigned(institutionId: string): Promise<number> {
    const [row] = await this.db
      .select({
        totalPaise: sum(feeAssignments.assignedAmountInPaise),
      })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          sql`${feeAssignments.deletedAt} IS NULL`,
        ),
      );

    return Number(row?.totalPaise ?? 0);
  }
}

// ── Helpers ────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
