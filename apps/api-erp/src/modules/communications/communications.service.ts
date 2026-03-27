import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
} from "@repo/contracts";
import {
  and,
  asc,
  announcements,
  campus,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  notificationReads,
  notifications,
  or,
  type AppDatabase,
  type SQL,
} from "@repo/database";
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import {
  ANNOUNCEMENT_AUDIENCE,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
  NOTIFICATION_TYPES,
} from "../../constants/status";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateAnnouncementDto,
  ListAnnouncementsQueryDto,
  ListNotificationsQueryDto,
  MarkNotificationsReadDto,
  SetAnnouncementStatusDto,
  UpdateAnnouncementDto,
} from "./communications.schemas";
import { AuditService } from "../audit/audit.service";

const sortableAnnouncementColumns = {
  audience: announcements.audience,
  publishedAt: announcements.publishedAt,
  status: announcements.status,
  title: announcements.title,
} as const;

@Injectable()
export class CommunicationsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listAnnouncements(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListAnnouncementsQueryDto = {},
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(scopedCampusId, scopes);
    await this.getCampus(institutionId, scopedCampusId);

    const conditions = this.buildAnnouncementConditions(
      institutionId,
      scopes,
      query,
      scopedCampusId,
    );
    const where = and(...conditions)!;
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? "publishedAt";
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(announcements)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: announcements.id,
        institutionId: announcements.institutionId,
        campusId: announcements.campusId,
        campusName: campus.name,
        title: announcements.title,
        summary: announcements.summary,
        body: announcements.body,
        audience: announcements.audience,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        createdByUserId: announcements.createdByUserId,
      })
      .from(announcements)
      .leftJoin(campus, eq(announcements.campusId, campus.id))
      .where(where)
      .orderBy(
        sortDirection(sortableAnnouncementColumns[sortKey]),
        desc(announcements.createdAt),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows,
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getAnnouncement(
    institutionId: string,
    announcementId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);

    return this.getAnnouncementOrThrow(
      institutionId,
      announcementId,
      activeCampusId,
    );
  }

  async createAnnouncement(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateAnnouncementDto,
  ) {
    this.ensureStaffContext(authSession);
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getCampus(institutionId, campusId);

    const announcementId = randomUUID();

    await this.db.insert(announcements).values({
      id: announcementId,
      institutionId,
      campusId,
      createdByUserId: authSession.user.id,
      title: payload.title.trim(),
      summary: payload.summary?.trim() ?? null,
      body: payload.body.trim(),
      audience: payload.audience,
      status: STATUS.ANNOUNCEMENT.DRAFT,
      publishedAt: null,
    });

    if (payload.publishNow) {
      await this.publishAnnouncementNotification(
        institutionId,
        announcementId,
        authSession,
        scopes,
      );
    }

    const announcement = await this.getAnnouncement(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ANNOUNCEMENT,
        entityId: announcementId,
        entityLabel: payload.title,
        summary: `Created announcement "${payload.title}".`,
      })
      .catch(() => {});

    return announcement;
  }

  async updateAnnouncement(
    institutionId: string,
    announcementId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateAnnouncementDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const existing = await this.getAnnouncementOrThrow(
      institutionId,
      announcementId,
      activeCampusId,
    );

    await this.db
      .update(announcements)
      .set({
        campusId: existing.campusId,
        title: payload.title.trim(),
        summary: payload.summary?.trim() ?? null,
        body: payload.body.trim(),
        audience: payload.audience,
      })
      .where(
        and(
          eq(announcements.id, announcementId),
          eq(announcements.institutionId, institutionId),
        ),
      );

    if (
      payload.publishNow &&
      existing.status !== STATUS.ANNOUNCEMENT.PUBLISHED
    ) {
      await this.publishAnnouncementNotification(
        institutionId,
        announcementId,
        authSession,
        scopes,
      );
    }

    const updatedAnnouncement = await this.getAnnouncement(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ANNOUNCEMENT,
        entityId: announcementId,
        entityLabel: payload.title,
        summary: `Updated announcement "${payload.title}".`,
      })
      .catch(() => {});

    return updatedAnnouncement;
  }

  async setAnnouncementStatus(
    institutionId: string,
    announcementId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetAnnouncementStatusDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getAnnouncementOrThrow(
      institutionId,
      announcementId,
      activeCampusId,
    );

    await this.db
      .update(announcements)
      .set({ status: payload.status })
      .where(
        and(
          eq(announcements.id, announcementId),
          eq(announcements.institutionId, institutionId),
        ),
      );

    return this.getAnnouncement(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );
  }

  async publishAnnouncement(
    institutionId: string,
    announcementId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    this.ensureStaffContext(authSession);
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.publishAnnouncementNotification(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );

    return this.getAnnouncement(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );
  }

  async listNotifications(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListNotificationsQueryDto = {},
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(scopedCampusId, scopes);
    await this.getCampus(institutionId, scopedCampusId);

    const conditions = this.buildNotificationConditions(
      institutionId,
      authSession,
      scopes,
      query,
      scopedCampusId,
    );
    const where = and(...conditions)!;
    const pageSize = resolveTablePageSize(query.limit);

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, authSession.user.id),
        ),
      )
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: notifications.id,
        campusId: notifications.campusId,
        campusName: campus.name,
        announcementId: notifications.announcementId,
        type: notifications.type,
        channel: notifications.channel,
        tone: notifications.tone,
        audience: notifications.audience,
        title: notifications.title,
        message: notifications.message,
        senderLabel: notifications.senderLabel,
        actionLabel: notifications.actionLabel,
        actionHref: notifications.actionHref,
        actionRequired: notifications.actionRequired,
        unread: isNull(notificationReads.notificationId),
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .leftJoin(campus, eq(notifications.campusId, campus.id))
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, authSession.user.id),
        ),
      )
      .where(where)
      .orderBy(desc(notifications.createdAt))
      .limit(pageSize)
      .offset(pagination.offset);

    const [unreadRow] = await this.db
      .select({ count: count() })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, authSession.user.id),
        ),
      )
      .where(
        and(
          ...this.buildNotificationConditions(
            institutionId,
            authSession,
            scopes,
            { ...query, unreadOnly: true },
            scopedCampusId,
          ),
        ),
      );

    const [actionRequiredRow] = await this.db
      .select({ count: count() })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, authSession.user.id),
        ),
      )
      .where(
        and(
          ...this.buildNotificationConditions(
            institutionId,
            authSession,
            scopes,
            { ...query, actionRequired: true },
            scopedCampusId,
          ),
        ),
      );

    return {
      rows,
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
      unreadCount: unreadRow?.count ?? 0,
      actionRequiredCount: actionRequiredRow?.count ?? 0,
    };
  }

  async markNotificationsRead(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: MarkNotificationsReadDto,
  ) {
    const notificationIds =
      payload.notificationIds && payload.notificationIds.length > 0
        ? await this.getVisibleNotificationIds(
            institutionId,
            authSession,
            scopes,
            payload.notificationIds,
          )
        : await this.getVisibleNotificationIds(
            institutionId,
            authSession,
            scopes,
          );

    if (notificationIds.length === 0) {
      return { updated: 0 };
    }

    await this.db
      .insert(notificationReads)
      .values(
        notificationIds.map((notificationId) => ({
          notificationId,
          userId: authSession.user.id,
          readAt: new Date(),
        })),
      )
      .onConflictDoUpdate({
        target: [notificationReads.notificationId, notificationReads.userId],
        set: {
          readAt: new Date(),
        },
      });

    return { updated: notificationIds.length };
  }

  private async publishAnnouncementNotification(
    institutionId: string,
    announcementId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const announcement = await this.getAnnouncement(
      institutionId,
      announcementId,
      authSession,
      scopes,
    );

    if (announcement.status === STATUS.ANNOUNCEMENT.PUBLISHED) {
      throw new ConflictException(
        ERROR_MESSAGES.COMMUNICATIONS.ANNOUNCEMENT_ALREADY_PUBLISHED,
      );
    }

    const notificationId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(notifications).values({
        id: notificationId,
        institutionId,
        campusId: announcement.campusId,
        announcementId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.ANNOUNCEMENT_PUBLISHED,
        channel: NOTIFICATION_CHANNELS.COMMUNITY,
        tone: NOTIFICATION_TONES.INFO,
        audience: announcement.audience,
        title: announcement.title,
        message: announcement.summary ?? announcement.body,
        senderLabel: authSession.user.name,
        actionLabel: "Open announcement",
        actionHref: null,
      });

      await tx
        .update(announcements)
        .set({
          status: STATUS.ANNOUNCEMENT.PUBLISHED,
          publishedAt: new Date(),
          publishedNotificationId: notificationId,
        })
        .where(
          and(
            eq(announcements.id, announcementId),
            eq(announcements.institutionId, institutionId),
          ),
        );
    });
  }

  private buildAnnouncementConditions(
    institutionId: string,
    scopes: ResolvedScopes,
    query: ListAnnouncementsQueryDto,
    scopedCampusId?: string,
  ) {
    const conditions: SQL[] = [
      eq(announcements.institutionId, institutionId),
      ne(announcements.status, STATUS.ANNOUNCEMENT.DELETED),
    ];

    if (query.search) {
      conditions.push(
        or(
          ilike(announcements.title, `%${query.search}%`),
          ilike(announcements.body, `%${query.search}%`),
        )!,
      );
    }

    if (query.status) {
      conditions.push(eq(announcements.status, query.status));
    }

    if (query.audience) {
      conditions.push(eq(announcements.audience, query.audience));
    }

    this.applyCampusScope(
      conditions,
      announcements.campusId,
      scopes,
      scopedCampusId,
    );

    return conditions;
  }

  private buildNotificationConditions(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListNotificationsQueryDto,
    scopedCampusId?: string,
  ) {
    const conditions: SQL[] = [eq(notifications.institutionId, institutionId)];
    const visibleAudience = this.getVisibleAudience(authSession);

    conditions.push(
      or(
        eq(notifications.audience, ANNOUNCEMENT_AUDIENCE.ALL),
        eq(notifications.audience, visibleAudience),
      )!,
    );

    if (query.search) {
      conditions.push(
        or(
          ilike(notifications.title, `%${query.search}%`),
          ilike(notifications.message, `%${query.search}%`),
        )!,
      );
    }

    if (query.channel) {
      conditions.push(eq(notifications.channel, query.channel));
    }

    if (query.unreadOnly) {
      conditions.push(isNull(notificationReads.notificationId));
    }

    if (query.actionRequired) {
      conditions.push(eq(notifications.actionRequired, true));
    }

    this.applyCampusScope(
      conditions,
      notifications.campusId,
      scopes,
      scopedCampusId,
    );

    return conditions;
  }

  private applyCampusScope(
    conditions: SQL[],
    column: typeof announcements.campusId | typeof notifications.campusId,
    scopes: ResolvedScopes,
    scopedCampusId?: string,
  ) {
    if (scopedCampusId) {
      conditions.push(or(isNull(column), eq(column, scopedCampusId))!);
      return;
    }

    if (scopes.campusIds !== "all") {
      conditions.push(or(isNull(column), inArray(column, scopes.campusIds))!);
    }
  }

  private async getVisibleNotificationIds(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    requestedNotificationIds?: string[],
  ) {
    const scopedCampusId = authSession.activeCampusId ?? undefined;
    const conditions = this.buildNotificationConditions(
      institutionId,
      authSession,
      scopes,
      {},
      scopedCampusId,
    );

    if (requestedNotificationIds && requestedNotificationIds.length > 0) {
      conditions.push(inArray(notifications.id, requestedNotificationIds));
    }

    const where = and(...conditions)!;

    const rows = await this.db
      .select({ id: notifications.id })
      .from(notifications)
      .leftJoin(
        notificationReads,
        and(
          eq(notificationReads.notificationId, notifications.id),
          eq(notificationReads.userId, authSession.user.id),
        ),
      )
      .where(where);

    return rows.map((row) => row.id);
  }

  private getVisibleAudience(authSession: AuthenticatedSession) {
    if (authSession.activeContextKey === "parent") {
      return ANNOUNCEMENT_AUDIENCE.GUARDIANS;
    }

    if (authSession.activeContextKey === "student") {
      return ANNOUNCEMENT_AUDIENCE.STUDENTS;
    }

    return ANNOUNCEMENT_AUDIENCE.STAFF;
  }

  private ensureStaffContext(authSession: AuthenticatedSession) {
    if (
      authSession.activeContextKey !== "staff" ||
      !authSession.activeOrganizationId
    ) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.PERMISSION_DENIED);
    }
  }

  private async getAnnouncementOrThrow(
    institutionId: string,
    announcementId: string,
    activeCampusId: string,
  ) {
    const [row] = await this.db
      .select({
        id: announcements.id,
        institutionId: announcements.institutionId,
        campusId: announcements.campusId,
        campusName: campus.name,
        audience: announcements.audience,
        title: announcements.title,
        summary: announcements.summary,
        body: announcements.body,
        status: announcements.status,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        updatedAt: announcements.updatedAt,
        createdByUserId: announcements.createdByUserId,
      })
      .from(announcements)
      .leftJoin(campus, eq(announcements.campusId, campus.id))
      .where(
        and(
          eq(announcements.id, announcementId),
          eq(announcements.institutionId, institutionId),
          ne(announcements.status, STATUS.ANNOUNCEMENT.DELETED),
        ),
      )
      .limit(1);

    if (!row || (row.campusId && row.campusId !== activeCampusId)) {
      throw new NotFoundException(
        ERROR_MESSAGES.COMMUNICATIONS.ANNOUNCEMENT_NOT_FOUND,
      );
    }

    return row;
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [campusRecord] = await this.db
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!campusRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return campusRecord;
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private assertCampusScopeAccess(campusId: string, scopes: ResolvedScopes) {
    if (scopes.campusIds === "all") {
      return;
    }

    if (!scopes.campusIds.includes(campusId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }
}
