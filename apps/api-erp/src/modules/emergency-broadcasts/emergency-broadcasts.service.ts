import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  BROADCAST_STATUS,
  BROADCAST_TARGET_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
} from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  broadcastDeliveryLogs,
  count,
  desc,
  emergencyBroadcasts,
  eq,
  ilike,
  isNull,
  member,
  notifications,
  studentGuardianLinks,
  studentTransportAssignments,
  students,
  user,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type {
  CreateBroadcastDto,
  ListBroadcastsQueryDto,
  UpdateBroadcastDto,
} from "./emergency-broadcasts.schemas";

// ── Hardcoded templates ──────────────────────────────────────────────────────

const BROADCAST_TEMPLATES = [
  {
    key: "school_closure",
    label: "School Closure",
    defaultTitle: "School Closure Notice",
    defaultMessage:
      "The school will remain closed today due to unforeseen circumstances. Please do not send your ward to school.",
  },
  {
    key: "early_dismissal",
    label: "Early Dismissal",
    defaultTitle: "Early Dismissal Notice",
    defaultMessage:
      "School will dismiss early today. Please arrange for your ward's pickup at the designated time.",
  },
  {
    key: "security_alert",
    label: "Security Alert",
    defaultTitle: "Security Alert",
    defaultMessage:
      "A security situation is being managed on campus. All students are safe. Please follow instructions from school administration.",
  },
  {
    key: "weather_alert",
    label: "Weather Alert",
    defaultTitle: "Weather Alert",
    defaultMessage:
      "Due to severe weather conditions, please take necessary precautions. School activities may be affected.",
  },
  {
    key: "transport_delay",
    label: "Transport Delay",
    defaultTitle: "Transport Delay Notice",
    defaultMessage:
      "School transport is running delayed today. Please expect a delay in pickup/drop timings.",
  },
] as const;

// ── Sort maps ────────────────────────────────────────────────────────────────

const broadcastSortColumns = {
  createdAt: emergencyBroadcasts.createdAt,
  sentAt: emergencyBroadcasts.sentAt,
} as const;

@Injectable()
export class EmergencyBroadcastsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  // ── CRUD ───────────────────────────────────────────────────────────────

  async listBroadcasts(institutionId: string, query: ListBroadcastsQueryDto) {
    const { q, status, priority, page, limit, sort, order } = query;
    const pageSize = resolveTablePageSize(limit);
    const orderFn = order === SORT_ORDERS.DESC ? desc : asc;
    const sortCol = broadcastSortColumns[sort ?? "createdAt"];

    const sentByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("sent_by_member");

    const conditions = [eq(emergencyBroadcasts.institutionId, institutionId)];
    if (q) {
      conditions.push(ilike(emergencyBroadcasts.title, `%${q}%`));
    }
    if (status) {
      conditions.push(eq(emergencyBroadcasts.status, status));
    }
    if (priority) {
      conditions.push(eq(emergencyBroadcasts.priority, priority));
    }

    const where = and(...conditions)!;

    const [totalResult] = await this.db
      .select({ count: count() })
      .from(emergencyBroadcasts)
      .where(where);

    const total = totalResult?.count ?? 0;
    const {
      page: safePage,
      pageCount,
      offset,
    } = resolvePagination(total, page, pageSize);

    const rows = await this.db
      .select({
        id: emergencyBroadcasts.id,
        institutionId: emergencyBroadcasts.institutionId,
        title: emergencyBroadcasts.title,
        message: emergencyBroadcasts.message,
        templateKey: emergencyBroadcasts.templateKey,
        targetType: emergencyBroadcasts.targetType,
        targetId: emergencyBroadcasts.targetId,
        priority: emergencyBroadcasts.priority,
        channels: emergencyBroadcasts.channels,
        status: emergencyBroadcasts.status,
        sentAt: emergencyBroadcasts.sentAt,
        sentByMemberName: sentByMember.userName,
        totalRecipients: emergencyBroadcasts.totalRecipients,
        deliveredCount: emergencyBroadcasts.deliveredCount,
        failedCount: emergencyBroadcasts.failedCount,
        createdAt: emergencyBroadcasts.createdAt,
      })
      .from(emergencyBroadcasts)
      .leftJoin(
        sentByMember,
        eq(emergencyBroadcasts.sentByMemberId, sentByMember.id),
      )
      .where(where)
      .orderBy(orderFn(sortCol))
      .limit(pageSize)
      .offset(offset);

    return {
      rows: rows.map((r) => ({
        ...r,
        sentByMemberName: r.sentByMemberName ?? "Unknown",
        sentAt: r.sentAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      page: safePage,
      pageSize,
      pageCount,
    };
  }

  async createBroadcast(
    institutionId: string,
    session: AuthenticatedSession,
    dto: CreateBroadcastDto,
  ) {
    // Resolve sender membership
    const [memberRecord] = await this.db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.userId, session.user.id),
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      )
      .limit(1);

    const sentByMemberId = memberRecord?.id ?? session.user.id;

    const id = randomUUID();

    await this.db.insert(emergencyBroadcasts).values({
      id,
      institutionId,
      title: dto.title,
      message: dto.message,
      templateKey: dto.templateKey ?? null,
      targetType: dto.targetType,
      targetId: dto.targetId ?? null,
      priority: dto.priority,
      channels: dto.channels,
      status: BROADCAST_STATUS.DRAFT,
      sentByMemberId,
    });

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.EMERGENCY_BROADCAST,
      entityId: id,
      entityLabel: dto.title,
      summary: `Created emergency broadcast "${dto.title}"`,
      metadata: { targetType: dto.targetType },
    });

    return this.getBroadcastById(institutionId, id);
  }

  async updateBroadcast(
    institutionId: string,
    broadcastId: string,
    session: AuthenticatedSession,
    dto: UpdateBroadcastDto,
  ) {
    const existing = await this.findBroadcast(institutionId, broadcastId);
    if (existing.status !== BROADCAST_STATUS.DRAFT) {
      throw new ConflictException(
        ERROR_MESSAGES.EMERGENCY_BROADCASTS.NOT_DRAFT,
      );
    }

    await this.db
      .update(emergencyBroadcasts)
      .set({
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.message !== undefined && { message: dto.message }),
        ...(dto.templateKey !== undefined && {
          templateKey: dto.templateKey,
        }),
        ...(dto.targetType !== undefined && {
          targetType: dto.targetType,
        }),
        ...(dto.targetId !== undefined && { targetId: dto.targetId }),
        ...(dto.priority !== undefined && { priority: dto.priority }),
        ...(dto.channels !== undefined && { channels: dto.channels }),
      })
      .where(
        and(
          eq(emergencyBroadcasts.id, broadcastId),
          eq(emergencyBroadcasts.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.EMERGENCY_BROADCAST,
      entityId: broadcastId,
      entityLabel: dto.title ?? existing.title,
      summary: `Updated emergency broadcast "${dto.title ?? existing.title}"`,
      metadata: { title: dto.title ?? existing.title },
    });

    return this.getBroadcastById(institutionId, broadcastId);
  }

  async getBroadcast(institutionId: string, broadcastId: string) {
    return this.getBroadcastById(institutionId, broadcastId);
  }

  // ── Send ───────────────────────────────────────────────────────────────

  async sendBroadcast(
    institutionId: string,
    broadcastId: string,
    session: AuthenticatedSession,
  ) {
    const broadcast = await this.findBroadcast(institutionId, broadcastId);
    if (broadcast.status !== BROADCAST_STATUS.DRAFT) {
      throw new ConflictException(
        ERROR_MESSAGES.EMERGENCY_BROADCASTS.ALREADY_SENT,
      );
    }

    // Mark as sending
    await this.db
      .update(emergencyBroadcasts)
      .set({ status: BROADCAST_STATUS.SENDING })
      .where(
        and(
          eq(emergencyBroadcasts.id, broadcastId),
          eq(emergencyBroadcasts.institutionId, institutionId),
        ),
      );

    // Resolve recipients based on target type
    const recipientUserIds = await this.resolveRecipients(
      institutionId,
      broadcast.targetType,
      broadcast.targetId,
    );

    if (recipientUserIds.length === 0) {
      // Mark as failed with no recipients
      await this.db
        .update(emergencyBroadcasts)
        .set({
          status: BROADCAST_STATUS.FAILED,
          totalRecipients: 0,
        })
        .where(
          and(
            eq(emergencyBroadcasts.id, broadcastId),
            eq(emergencyBroadcasts.institutionId, institutionId),
          ),
        );
      throw new ConflictException(
        ERROR_MESSAGES.EMERGENCY_BROADCASTS.NO_RECIPIENTS,
      );
    }

    const channels = broadcast.channels;

    // Create delivery logs for each recipient per channel
    const deliveryLogValues = recipientUserIds.flatMap((userId) =>
      channels.map((channel) => ({
        id: randomUUID(),
        broadcastId,
        recipientUserId: userId,
        channel,
        status: "pending" as const,
      })),
    );

    // Insert in batches to avoid oversized queries
    const BATCH_SIZE = 500;
    for (let i = 0; i < deliveryLogValues.length; i += BATCH_SIZE) {
      const batch = deliveryLogValues.slice(i, i + BATCH_SIZE);
      await this.db.insert(broadcastDeliveryLogs).values(batch);
    }

    // Create in-app notifications for each recipient
    if (channels.includes("in_app")) {
      const notificationValues = recipientUserIds.map((_userId) => ({
        id: randomUUID(),
        institutionId,
        createdByUserId: session.user.id,
        type: NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
        channel: NOTIFICATION_CHANNELS.SYSTEM,
        tone:
          broadcast.priority === "critical"
            ? NOTIFICATION_TONES.CRITICAL
            : NOTIFICATION_TONES.WARNING,
        audience: "all" as const,
        title: broadcast.title,
        message: broadcast.message,
        senderLabel: "Emergency Alert",
      }));

      for (let i = 0; i < notificationValues.length; i += BATCH_SIZE) {
        const batch = notificationValues.slice(i, i + BATCH_SIZE);
        await this.db.insert(notifications).values(batch);
      }
    }

    // Mark as sent
    await this.db
      .update(emergencyBroadcasts)
      .set({
        status: BROADCAST_STATUS.SENT,
        sentAt: new Date(),
        totalRecipients: recipientUserIds.length,
      })
      .where(
        and(
          eq(emergencyBroadcasts.id, broadcastId),
          eq(emergencyBroadcasts.institutionId, institutionId),
        ),
      );

    await this.auditService.record({
      institutionId,
      authSession: session,
      action: AUDIT_ACTIONS.EXECUTE,
      entityType: AUDIT_ENTITY_TYPES.EMERGENCY_BROADCAST,
      entityId: broadcastId,
      entityLabel: broadcast.title,
      summary: `Sent emergency broadcast "${broadcast.title}" to ${recipientUserIds.length} recipients`,
      metadata: {
        status: BROADCAST_STATUS.SENT,
        totalRecipients: recipientUserIds.length,
        channels,
      },
    });

    return this.getBroadcastById(institutionId, broadcastId);
  }

  // ── Delivery stats ─────────────────────────────────────────────────────

  async getDeliveryStats(institutionId: string, broadcastId: string) {
    await this.findBroadcast(institutionId, broadcastId);

    const channelStats = await this.db
      .select({
        channel: broadcastDeliveryLogs.channel,
        status: broadcastDeliveryLogs.status,
        count: count(),
      })
      .from(broadcastDeliveryLogs)
      .where(eq(broadcastDeliveryLogs.broadcastId, broadcastId))
      .groupBy(broadcastDeliveryLogs.channel, broadcastDeliveryLogs.status);

    // Aggregate by channel
    const channelMap = new Map<
      string,
      { pending: number; delivered: number; failed: number }
    >();

    let totalDelivered = 0;
    let totalFailed = 0;
    let totalPending = 0;

    for (const row of channelStats) {
      if (!channelMap.has(row.channel)) {
        channelMap.set(row.channel, { pending: 0, delivered: 0, failed: 0 });
      }
      const entry = channelMap.get(row.channel)!;
      if (row.status === "pending") {
        entry.pending += row.count;
        totalPending += row.count;
      } else if (row.status === "delivered") {
        entry.delivered += row.count;
        totalDelivered += row.count;
      } else if (row.status === "failed") {
        entry.failed += row.count;
        totalFailed += row.count;
      }
    }

    const byChannel = Array.from(channelMap.entries()).map(
      ([channel, stats]) => ({
        channel,
        ...stats,
      }),
    );

    const totalRecipients = totalDelivered + totalFailed + totalPending;

    return {
      totalRecipients,
      deliveredCount: totalDelivered,
      failedCount: totalFailed,
      pendingCount: totalPending,
      byChannel,
    };
  }

  // ── Templates ──────────────────────────────────────────────────────────

  listTemplates() {
    return {
      templates: BROADCAST_TEMPLATES.map((t) => ({
        key: t.key,
        label: t.label,
        defaultTitle: t.defaultTitle,
        defaultMessage: t.defaultMessage,
      })),
    };
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private async findBroadcast(institutionId: string, broadcastId: string) {
    const [row] = await this.db
      .select()
      .from(emergencyBroadcasts)
      .where(
        and(
          eq(emergencyBroadcasts.id, broadcastId),
          eq(emergencyBroadcasts.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.EMERGENCY_BROADCASTS.NOT_FOUND,
      );
    }
    return row;
  }

  private async getBroadcastById(institutionId: string, broadcastId: string) {
    const sentByMember = this.db
      .select({ id: member.id, userName: user.name })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .as("sent_by_member");

    const [row] = await this.db
      .select({
        id: emergencyBroadcasts.id,
        institutionId: emergencyBroadcasts.institutionId,
        title: emergencyBroadcasts.title,
        message: emergencyBroadcasts.message,
        templateKey: emergencyBroadcasts.templateKey,
        targetType: emergencyBroadcasts.targetType,
        targetId: emergencyBroadcasts.targetId,
        priority: emergencyBroadcasts.priority,
        channels: emergencyBroadcasts.channels,
        status: emergencyBroadcasts.status,
        sentAt: emergencyBroadcasts.sentAt,
        sentByMemberName: sentByMember.userName,
        totalRecipients: emergencyBroadcasts.totalRecipients,
        deliveredCount: emergencyBroadcasts.deliveredCount,
        failedCount: emergencyBroadcasts.failedCount,
        createdAt: emergencyBroadcasts.createdAt,
      })
      .from(emergencyBroadcasts)
      .leftJoin(
        sentByMember,
        eq(emergencyBroadcasts.sentByMemberId, sentByMember.id),
      )
      .where(
        and(
          eq(emergencyBroadcasts.id, broadcastId),
          eq(emergencyBroadcasts.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.EMERGENCY_BROADCASTS.NOT_FOUND,
      );
    }

    return {
      ...row,
      sentByMemberName: row.sentByMemberName ?? "Unknown",
      sentAt: row.sentAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  /**
   * Resolve recipient user IDs based on target type.
   * Returns distinct user IDs (parents/guardians for student-scoped targets,
   * all users for "all" target).
   */
  private async resolveRecipients(
    institutionId: string,
    targetType: string,
    targetId: string | null,
  ): Promise<string[]> {
    switch (targetType) {
      case BROADCAST_TARGET_TYPES.ALL:
        return this.resolveAllUsers(institutionId);
      case BROADCAST_TARGET_TYPES.CAMPUS:
        return this.resolveCampusUsers(institutionId, targetId!);
      case BROADCAST_TARGET_TYPES.CLASS:
        return this.resolveClassParents(institutionId, targetId!);
      case BROADCAST_TARGET_TYPES.SECTION:
        return this.resolveSectionParents(institutionId, targetId!);
      case BROADCAST_TARGET_TYPES.TRANSPORT_ROUTE:
        return this.resolveRouteParents(institutionId, targetId!);
      default:
        return [];
    }
  }

  /** All active users in the institution */
  private async resolveAllUsers(institutionId: string): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: user.id })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.status, "active"),
        ),
      );
    return rows.map((r) => r.userId);
  }

  /** All active users with memberships tied to a campus */
  private async resolveCampusUsers(
    institutionId: string,
    campusId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: user.id })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.primaryCampusId, campusId),
          eq(member.status, "active"),
        ),
      );
    return rows.map((r) => r.userId);
  }

  /** Parents/guardians of students in a specific class */
  private async resolveClassParents(
    institutionId: string,
    classId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: user.id })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .innerJoin(
        studentGuardianLinks,
        eq(studentGuardianLinks.parentMembershipId, member.id),
      )
      .innerJoin(
        students,
        and(
          eq(students.membershipId, studentGuardianLinks.studentMembershipId),
          isNull(students.deletedAt),
        ),
      )
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.classId, classId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );
    return rows.map((r) => r.userId);
  }

  /** Parents/guardians of students in a specific section */
  private async resolveSectionParents(
    institutionId: string,
    sectionId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: user.id })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .innerJoin(
        studentGuardianLinks,
        eq(studentGuardianLinks.parentMembershipId, member.id),
      )
      .innerJoin(
        students,
        and(
          eq(students.membershipId, studentGuardianLinks.studentMembershipId),
          isNull(students.deletedAt),
        ),
      )
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.sectionId, sectionId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );
    return rows.map((r) => r.userId);
  }

  /** Parents/guardians of students assigned to a transport route */
  private async resolveRouteParents(
    institutionId: string,
    routeId: string,
  ): Promise<string[]> {
    const rows = await this.db
      .selectDistinct({ userId: user.id })
      .from(user)
      .innerJoin(member, eq(member.userId, user.id))
      .innerJoin(
        studentGuardianLinks,
        eq(studentGuardianLinks.parentMembershipId, member.id),
      )
      .innerJoin(
        students,
        and(
          eq(students.membershipId, studentGuardianLinks.studentMembershipId),
          isNull(students.deletedAt),
        ),
      )
      .innerJoin(
        studentTransportAssignments,
        and(
          eq(studentTransportAssignments.studentId, students.id),
          eq(studentTransportAssignments.status, "active"),
        ),
      )
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(studentTransportAssignments.routeId, routeId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );
    return rows.map((r) => r.userId);
  }
}
