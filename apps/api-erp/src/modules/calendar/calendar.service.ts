import { DATABASE } from "@repo/backend-core";
import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  calendarEvents,
  campus,
  count,
  desc,
  eq,
  gte,
  ilike,
  lte,
  ne,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateCalendarEventDto,
  ListCalendarEventsQueryDto,
  SetCalendarEventStatusDto,
  UpdateCalendarEventDto,
} from "./calendar.schemas";
import {
  normalizeCalendarValue,
  sortableCalendarColumns,
} from "./calendar.schemas";

const sortableColumns = {
  date: calendarEvents.eventDate,
  status: calendarEvents.status,
  title: calendarEvents.title,
  type: calendarEvents.eventType,
} as const;

@Injectable()
export class CalendarService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listEvents(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListCalendarEventsQueryDto = {},
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(scopedCampusId, scopes);
    await this.getCampus(institutionId, scopedCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableCalendarColumns.date;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;

    const conditions: SQL[] = [
      eq(calendarEvents.institutionId, institutionId),
      ne(calendarEvents.status, STATUS.CALENDAR_EVENT.DELETED),
    ];

    if (query.fromDate) {
      conditions.push(gte(calendarEvents.eventDate, query.fromDate));
    }

    if (query.toDate) {
      conditions.push(lte(calendarEvents.eventDate, query.toDate));
    }

    if (query.search) {
      conditions.push(ilike(calendarEvents.title, `%${query.search}%`));
    }

    conditions.push(eq(calendarEvents.campusId, scopedCampusId));

    const where = and(...conditions)!;

    const [totalRow] = await this.db
      .select({ count: count() })
      .from(calendarEvents)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: calendarEvents.id,
        institutionId: calendarEvents.institutionId,
        campusId: calendarEvents.campusId,
        campusName: campus.name,
        title: calendarEvents.title,
        description: calendarEvents.description,
        eventDate: calendarEvents.eventDate,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        isAllDay: calendarEvents.isAllDay,
        eventType: calendarEvents.eventType,
        status: calendarEvents.status,
        createdAt: calendarEvents.createdAt,
      })
      .from(calendarEvents)
      .leftJoin(campus, eq(calendarEvents.campusId, campus.id))
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        asc(calendarEvents.title),
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

  async getEvent(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);

    const [row] = await this.db
      .select({
        id: calendarEvents.id,
        institutionId: calendarEvents.institutionId,
        campusId: calendarEvents.campusId,
        campusName: campus.name,
        title: calendarEvents.title,
        description: calendarEvents.description,
        eventDate: calendarEvents.eventDate,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        isAllDay: calendarEvents.isAllDay,
        eventType: calendarEvents.eventType,
        status: calendarEvents.status,
        createdAt: calendarEvents.createdAt,
      })
      .from(calendarEvents)
      .leftJoin(campus, eq(calendarEvents.campusId, campus.id))
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
          eq(calendarEvents.campusId, activeCampusId),
          ne(calendarEvents.status, STATUS.CALENDAR_EVENT.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.CALENDAR.EVENT_NOT_FOUND);
    }

    return row;
  }

  async createEvent(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateCalendarEventDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getCampus(institutionId, campusId);

    const eventId = randomUUID();

    await this.db.insert(calendarEvents).values({
      id: eventId,
      institutionId,
      campusId,
      title: normalizeCalendarValue(payload.title)!,
      description: normalizeCalendarValue(payload.description) ?? null,
      eventDate: payload.eventDate,
      startTime: payload.isAllDay ? null : (payload.startTime ?? null),
      endTime: payload.isAllDay ? null : (payload.endTime ?? null),
      isAllDay: payload.isAllDay,
      eventType: payload.eventType,
      status: STATUS.CALENDAR_EVENT.ACTIVE,
    });

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
        entityId: eventId,
        entityLabel: payload.title,
        summary: `Created calendar event ${payload.title}.`,
      })
      .catch(() => {});

    return this.getEvent(institutionId, eventId, authSession, scopes);
  }

  async updateEvent(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateCalendarEventDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getEventOrThrow(institutionId, eventId, campusId);

    await this.db
      .update(calendarEvents)
      .set({
        title: normalizeCalendarValue(payload.title)!,
        description: normalizeCalendarValue(payload.description) ?? null,
        eventDate: payload.eventDate,
        startTime: payload.isAllDay ? null : (payload.startTime ?? null),
        endTime: payload.isAllDay ? null : (payload.endTime ?? null),
        isAllDay: payload.isAllDay,
        eventType: payload.eventType,
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
        ),
      );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
        entityId: eventId,
        entityLabel: payload.title,
        summary: `Updated calendar event ${payload.title}.`,
      })
      .catch(() => {});

    return this.getEvent(institutionId, eventId, authSession, scopes);
  }

  async setEventStatus(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetCalendarEventStatusDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getEventOrThrow(institutionId, eventId, campusId);

    await this.db
      .update(calendarEvents)
      .set({ status: payload.status })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
        ),
      );

    return this.getEvent(institutionId, eventId, authSession, scopes);
  }

  async deleteEvent(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getEventOrThrow(institutionId, eventId, campusId);

    await this.db
      .update(calendarEvents)
      .set({
        status: STATUS.CALENDAR_EVENT.DELETED,
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
        ),
      );

    this.auditService
      .record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.DELETE,
        entityType: AUDIT_ENTITY_TYPES.CALENDAR_EVENT,
        entityId: eventId,
        summary: `Deleted calendar event.`,
      })
      .catch(() => {});
  }

  private async getEventOrThrow(
    institutionId: string,
    eventId: string,
    campusId: string,
  ) {
    const [eventRow] = await this.db
      .select({
        id: calendarEvents.id,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
          eq(calendarEvents.campusId, campusId),
          ne(calendarEvents.status, STATUS.CALENDAR_EVENT.DELETED),
        ),
      )
      .limit(1);

    if (!eventRow) {
      throw new NotFoundException(ERROR_MESSAGES.CALENDAR.EVENT_NOT_FOUND);
    }

    return eventRow;
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
