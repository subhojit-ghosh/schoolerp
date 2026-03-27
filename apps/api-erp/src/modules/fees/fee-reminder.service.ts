import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { DATABASE } from "@repo/backend-core";
import {
  alias,
  and,
  eq,
  feeAssignments,
  isNull,
  lt,
  member,
  ne,
  sql,
  studentGuardianLinks,
  students,
  user,
  type AppDatabase,
} from "@repo/database";
import {
  FEE_ASSIGNMENT_STATUSES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
} from "@repo/contracts";
import { ERROR_MESSAGES, SYSTEM_ACTOR_ID } from "../../constants";
import { NotificationFactory } from "../communications/notification.factory";

type GuardianContact = {
  name: string;
  mobile: string;
  email: string | null;
  isPrimary: boolean;
};

type SendReminderOptions = {
  /** When true, skip the 24-hour cooldown check (manual sends). */
  skipCooldown?: boolean;
};

const REMINDER_COOLDOWN_HOURS = 24;

// 08:00 UTC daily (≈ 13:30 IST — acceptable mid-day sweep)
const REMINDER_CRON = "0 8 * * *";

@Injectable()
export class FeeReminderService {
  private readonly logger = new Logger(FeeReminderService.name);

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  /**
   * Send a fee reminder to all guardians of a student for a specific assignment.
   * Used by both the manual endpoint and the daily cron sweep.
   */
  async sendReminder(
    institutionId: string,
    feeAssignmentId: string,
    triggeredByUserId: string,
    options: SendReminderOptions = {},
  ): Promise<{ sentAt: Date; recipientCount: number }> {
    const rows = await this.db
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
        status: feeAssignments.status,
        lastReminderSentAt: feeAssignments.lastReminderSentAt,
        studentMembershipId: students.membershipId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        campusId: students.classId, // used for notification only
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
      })
      .from(feeAssignments)
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .where(
        and(
          eq(feeAssignments.id, feeAssignmentId),
          eq(feeAssignments.institutionId, institutionId),
          isNull(feeAssignments.deletedAt),
        ),
      )
      .limit(1);

    const assignment = rows[0];

    if (!assignment) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_NOT_FOUND);
    }

    if (assignment.status === FEE_ASSIGNMENT_STATUSES.PAID) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_ALREADY_PAID,
      );
    }

    if (!options.skipCooldown && assignment.lastReminderSentAt) {
      const hoursSince =
        (Date.now() - new Date(assignment.lastReminderSentAt).getTime()) /
        (1000 * 60 * 60);

      if (hoursSince < REMINDER_COOLDOWN_HOURS) {
        throw new BadRequestException(
          `A reminder was already sent ${Math.floor(hoursSince)} hour(s) ago. Wait ${REMINDER_COOLDOWN_HOURS} hours between reminders.`,
        );
      }
    }

    const contacts = await this.resolveGuardianContacts(
      institutionId,
      assignment.studentMembershipId,
    );

    if (contacts.length === 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_REMINDER_NO_GUARDIAN,
      );
    }

    const studentName =
      `${assignment.studentFirstName} ${assignment.studentLastName ?? ""}`.trim();
    const amountStr = `₹${(assignment.assignedAmountInPaise / 100).toFixed(2)}`;
    const message = `Reminder: A fee of ${amountStr} for ${studentName} is due on ${assignment.dueDate}. Please pay at the earliest.`;

    const primaryContact =
      contacts.find((c) => c.isPrimary) ?? contacts[0]!;

    // Create in-app notification once (for staff-facing feed)
    this.notificationFactory
      .notify({
        institutionId,
        createdByUserId: triggeredByUserId,
        type: NOTIFICATION_TYPES.FEE_REMINDER_SENT,
        channel: NOTIFICATION_CHANNELS.FINANCE,
        tone: NOTIFICATION_TONES.WARNING,
        audience: "guardians",
        title: "Fee reminder sent",
        message,
        senderLabel: "Fee Reminder",
        outboundDelivery: {
          sms: { to: primaryContact.mobile, text: message },
          email: primaryContact.email
            ? {
                to: primaryContact.email,
                subject: `Fee reminder for ${studentName}`,
                text: message,
              }
            : undefined,
        },
      })
      .catch((err) => {
        this.logger.error(
          `Notification failed for assignment ${feeAssignmentId}: ${String(err)}`,
        );
      });

    const sentAt = new Date();

    await this.db
      .update(feeAssignments)
      .set({ lastReminderSentAt: sentAt })
      .where(eq(feeAssignments.id, feeAssignmentId));

    return { sentAt, recipientCount: contacts.length };
  }

  /**
   * Daily cron: send reminders for all overdue pending/partial assignments
   * that have not received a reminder in the past 24 hours.
   */
  @Cron(REMINDER_CRON)
  async runOverdueReminderSweep(): Promise<void> {
    this.logger.log("Starting overdue fee reminder sweep...");

    const cooldownCutoff = new Date(
      Date.now() - REMINDER_COOLDOWN_HOURS * 60 * 60 * 1000,
    );
    const today = new Date().toISOString().slice(0, 10);

    const overdueRows = await this.db
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
      })
      .from(feeAssignments)
      .where(
        and(
          ne(feeAssignments.status, FEE_ASSIGNMENT_STATUSES.PAID),
          lt(feeAssignments.dueDate, today),
          isNull(feeAssignments.deletedAt),
          // Either never reminded, or last reminder was > 24h ago
          sql`(${feeAssignments.lastReminderSentAt} IS NULL OR ${feeAssignments.lastReminderSentAt} < ${cooldownCutoff})`,
        ),
      )
      .limit(500); // safety cap per sweep

    this.logger.log(
      `Found ${overdueRows.length} overdue assignments eligible for reminders`,
    );

    let sent = 0;
    let skipped = 0;

    for (const row of overdueRows) {
      try {
        await this.sendReminder(row.institutionId, row.id, SYSTEM_ACTOR_ID, {
          skipCooldown: true, // query already filtered — no need to double-check
        });
        sent++;
      } catch (err) {
        skipped++;
        this.logger.debug(
          `Skipped reminder for assignment ${row.id}: ${String(err)}`,
        );
      }
    }

    this.logger.log(
      `Reminder sweep complete: ${sent} sent, ${skipped} skipped`,
    );
  }

  private async resolveGuardianContacts(
    institutionId: string,
    studentMembershipId: string,
  ): Promise<GuardianContact[]> {
    const guardianMember = alias(member, "guardian_member");
    const guardianUser = alias(user, "guardian_user");

    const rows = await this.db
      .select({
        name: guardianUser.name,
        mobile: guardianUser.mobile,
        email: guardianUser.email,
        isPrimary: studentGuardianLinks.isPrimary,
      })
      .from(studentGuardianLinks)
      .innerJoin(
        guardianMember,
        eq(studentGuardianLinks.parentMembershipId, guardianMember.id),
      )
      .innerJoin(guardianUser, eq(guardianMember.userId, guardianUser.id))
      .where(
        and(
          eq(studentGuardianLinks.studentMembershipId, studentMembershipId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );

    return rows
      .filter((r) => r.mobile)
      .map((r) => ({
        name: r.name ?? "Guardian",
        mobile: r.mobile!,
        email: r.email,
        isPrimary: r.isPrimary,
      }));
  }
}
