import { DATABASE } from "@repo/backend-core";
import {
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import { calendarEvents, campus } from "@repo/database";
import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  ne,
  or,
  gte,
  lte,
  type SQL,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
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
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listEvents(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListCalendarEventsQueryDto = {},
  ) {
    const scopedCampusId = query.campusId ?? authSession.activeCampusId ?? undefined;

    if (scopedCampusId) {
      await this.getCampus(institutionId, scopedCampusId);
    }

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

    if (scopedCampusId) {
      conditions.push(
        or(
          isNull(calendarEvents.campusId),
          eq(calendarEvents.campusId, scopedCampusId),
        )!,
      );
    } else if (scopes.campusIds !== "all") {
      conditions.push(
        or(
          isNull(calendarEvents.campusId),
          inArray(calendarEvents.campusId, scopes.campusIds),
        )!,
      );
    }

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
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(calendarEvents.title))
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
    _authSession: AuthenticatedSession,
  ) {
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
    payload: CreateCalendarEventDto,
  ) {
    if (payload.campusId) {
      await this.getCampus(institutionId, payload.campusId);
    }

    const eventId = randomUUID();

    await this.db.insert(calendarEvents).values({
      id: eventId,
      institutionId,
      campusId: payload.campusId ?? null,
      title: normalizeCalendarValue(payload.title)!,
      description: normalizeCalendarValue(payload.description) ?? null,
      eventDate: payload.eventDate,
      startTime: payload.isAllDay ? null : payload.startTime ?? null,
      endTime: payload.isAllDay ? null : payload.endTime ?? null,
      isAllDay: payload.isAllDay,
      eventType: payload.eventType,
      status: STATUS.CALENDAR_EVENT.ACTIVE,
    });

    return this.getEvent(institutionId, eventId, authSession);
  }

  async updateEvent(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    payload: UpdateCalendarEventDto,
  ) {
    await this.getEventOrThrow(institutionId, eventId);

    if (payload.campusId) {
      await this.getCampus(institutionId, payload.campusId);
    }

    await this.db
      .update(calendarEvents)
      .set({
        campusId: payload.campusId ?? null,
        title: normalizeCalendarValue(payload.title)!,
        description: normalizeCalendarValue(payload.description) ?? null,
        eventDate: payload.eventDate,
        startTime: payload.isAllDay ? null : payload.startTime ?? null,
        endTime: payload.isAllDay ? null : payload.endTime ?? null,
        isAllDay: payload.isAllDay,
        eventType: payload.eventType,
      })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
        ),
      );

    return this.getEvent(institutionId, eventId, authSession);
  }

  async setEventStatus(
    institutionId: string,
    eventId: string,
    authSession: AuthenticatedSession,
    payload: SetCalendarEventStatusDto,
  ) {
    await this.getEventOrThrow(institutionId, eventId);

    await this.db
      .update(calendarEvents)
      .set({ status: payload.status })
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
        ),
      );

    return this.getEvent(institutionId, eventId, authSession);
  }

  async deleteEvent(
    institutionId: string,
    eventId: string,
    _authSession: AuthenticatedSession,
  ) {
    await this.getEventOrThrow(institutionId, eventId);

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
  }

  private async getEventOrThrow(institutionId: string, eventId: string) {
    const [eventRow] = await this.db
      .select({
        id: calendarEvents.id,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, eventId),
          eq(calendarEvents.institutionId, institutionId),
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
}
