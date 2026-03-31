import { Injectable, Logger } from "@nestjs/common";
import {
  DOMAIN_EVENT_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
  type DomainEventType,
} from "@repo/contracts";
import {
  ANNOUNCEMENT_AUDIENCE,
} from "../../constants";
import {
  NotificationFactory,
  type NotifyInput,
} from "../communications/notification.factory";

type EventPayload = {
  id: string;
  institutionId: string;
  eventType: DomainEventType;
  payload: Record<string, unknown>;
};

const SYSTEM_SENDER = "School ERP";

@Injectable()
export class WorkflowListeners {
  private readonly logger = new Logger(WorkflowListeners.name);

  constructor(
    private readonly notificationFactory: NotificationFactory,
  ) {}

  /**
   * Returns a map of event type -> handler for registration.
   */
  getListenerMap(): Map<DomainEventType, (event: EventPayload) => Promise<void>> {
    const map = new Map<DomainEventType, (event: EventPayload) => Promise<void>>();

    map.set(
      DOMAIN_EVENT_TYPES.ATTENDANCE_ABSENT,
      this.handleAttendanceAbsent.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.ATTENDANCE_ABSENT_STREAK,
      this.handleAttendanceAbsentStreak.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.FEE_OVERDUE,
      this.handleFeeOverdue.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.FEE_PAYMENT_RECEIVED,
      this.handleFeePaymentReceived.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.ADMISSION_APPROVED,
      this.handleAdmissionApproved.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.LEAVE_APPROVED,
      this.handleLeaveApproved.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.LEAVE_REJECTED,
      this.handleLeaveRejected.bind(this),
    );
    map.set(
      DOMAIN_EVENT_TYPES.ANNOUNCEMENT_PUBLISHED,
      this.handleAnnouncementPublished.bind(this),
    );

    return map;
  }

  /**
   * attendance.absent -> notify guardian that student was absent
   */
  private async handleAttendanceAbsent(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const studentName = (payload.studentName as string) ?? "Your child";
    const date = (payload.date as string) ?? "today";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.markedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.ATTENDANCE_ABSENT,
      channel: NOTIFICATION_CHANNELS.ACADEMICS,
      tone: NOTIFICATION_TONES.WARNING,
      audience: ANNOUNCEMENT_AUDIENCE.GUARDIANS,
      title: "Absence Notification",
      message: `${studentName} was marked absent on ${date}.`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/attendance",
      actionLabel: "View Attendance",
    });
  }

  /**
   * attendance.absent.streak -> notify class teacher of consecutive absences
   */
  private async handleAttendanceAbsentStreak(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const studentName = (payload.studentName as string) ?? "A student";
    const streakDays = (payload.streakDays as number) ?? 3;

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.markedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.ATTENDANCE_ABSENT_STREAK,
      channel: NOTIFICATION_CHANNELS.ACADEMICS,
      tone: NOTIFICATION_TONES.CRITICAL,
      audience: ANNOUNCEMENT_AUDIENCE.STAFF,
      title: "Attention Required: Absence Streak",
      message: `${studentName} has been absent for ${streakDays} consecutive days and needs attention.`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/attendance",
      actionLabel: "View Attendance",
      actionRequired: true,
    });
  }

  /**
   * fee.overdue -> notify guardian of overdue fee
   */
  private async handleFeeOverdue(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const studentName = (payload.studentName as string) ?? "Your child";
    const amount = (payload.amountLabel as string) ?? "";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.initiatedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.FEE_REMINDER_SENT,
      channel: NOTIFICATION_CHANNELS.FINANCE,
      tone: NOTIFICATION_TONES.WARNING,
      audience: ANNOUNCEMENT_AUDIENCE.GUARDIANS,
      title: "Fee Payment Reminder",
      message: `A fee payment${amount ? ` of ${amount}` : ""} for ${studentName} is overdue. Please clear the dues at the earliest.`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/fees",
      actionLabel: "View Fees",
    });
  }

  /**
   * fee.payment.received -> confirm payment to guardian
   */
  private async handleFeePaymentReceived(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const studentName = (payload.studentName as string) ?? "Your child";
    const amount = (payload.amountLabel as string) ?? "";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.collectedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.FEE_PAYMENT_RECEIVED,
      channel: NOTIFICATION_CHANNELS.FINANCE,
      tone: NOTIFICATION_TONES.POSITIVE,
      audience: ANNOUNCEMENT_AUDIENCE.GUARDIANS,
      title: "Payment Received",
      message: `Payment${amount ? ` of ${amount}` : ""} for ${studentName} has been received. Thank you!`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/fees",
      actionLabel: "View Receipt",
    });
  }

  /**
   * admission.approved -> suggest conversion to student
   */
  private async handleAdmissionApproved(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const applicantName = (payload.applicantName as string) ?? "An applicant";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.approvedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.ADMISSION_CONVERSION_SUGGESTED,
      channel: NOTIFICATION_CHANNELS.OPERATIONS,
      tone: NOTIFICATION_TONES.POSITIVE,
      audience: ANNOUNCEMENT_AUDIENCE.STAFF,
      title: "Admission Approved",
      message: `${applicantName}'s admission has been approved. Consider converting to a student record.`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/admissions",
      actionLabel: "View Application",
    });
  }

  /**
   * leave.approved -> notify the applicant
   */
  private async handleLeaveApproved(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const fromDate = (payload.fromDate as string) ?? "";
    const toDate = (payload.toDate as string) ?? "";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.reviewedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.LEAVE_APPROVED,
      channel: NOTIFICATION_CHANNELS.OPERATIONS,
      tone: NOTIFICATION_TONES.POSITIVE,
      audience: ANNOUNCEMENT_AUDIENCE.STAFF,
      title: "Leave Approved",
      message: `Your leave application from ${fromDate} to ${toDate} has been approved.`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/leave",
      actionLabel: "View Leave",
    });
  }

  /**
   * leave.rejected -> notify the applicant
   */
  private async handleLeaveRejected(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const fromDate = (payload.fromDate as string) ?? "";
    const toDate = (payload.toDate as string) ?? "";
    const reason = (payload.reviewNote as string) ?? "";

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.reviewedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.LEAVE_REJECTED,
      channel: NOTIFICATION_CHANNELS.OPERATIONS,
      tone: NOTIFICATION_TONES.WARNING,
      audience: ANNOUNCEMENT_AUDIENCE.STAFF,
      title: "Leave Rejected",
      message: `Your leave application from ${fromDate} to ${toDate} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/leave",
      actionLabel: "View Leave",
    });
  }

  /**
   * announcement.published -> create announcement notification
   */
  private async handleAnnouncementPublished(event: EventPayload): Promise<void> {
    const { institutionId, payload } = event;
    const title = (payload.title as string) ?? "New Announcement";
    const audience = (payload.audience as string) ?? ANNOUNCEMENT_AUDIENCE.ALL;

    await this.createNotification({
      institutionId,
      campusId: payload.campusId as string | undefined,
      createdByUserId: (payload.publishedByUserId as string) ?? "",
      type: NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
      channel: NOTIFICATION_CHANNELS.COMMUNITY,
      tone: NOTIFICATION_TONES.INFO,
      audience,
      title: "New Announcement",
      message: title,
      senderLabel: SYSTEM_SENDER,
      actionHref: "/communications",
      actionLabel: "Read More",
    });
  }

  private async createNotification(
    input: Omit<NotifyInput, "createdByUserId"> & { createdByUserId: string },
  ): Promise<void> {
    try {
      await this.notificationFactory.notify(input);
    } catch (error) {
      this.logger.error(
        `Failed to create notification for ${input.type}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error; // Re-throw so the event is marked as failed
    }
  }
}
