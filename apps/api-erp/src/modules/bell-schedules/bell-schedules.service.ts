import { DATABASE } from "@repo/backend-core";
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  bellSchedulePeriods,
  bellSchedules,
  campus,
  count,
  desc,
  eq,
  ilike,
  inArray,
  ne,
  timetableEntries,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateBellScheduleDto,
  ListBellSchedulesQueryDto,
  ReplaceBellSchedulePeriodsDto,
  SetBellScheduleStatusDto,
  UpdateBellScheduleDto,
} from "./bell-schedules.schemas";
import { sortableBellScheduleColumns } from "./bell-schedules.schemas";

const sortableColumns = {
  createdAt: bellSchedules.createdAt,
  name: bellSchedules.name,
  status: bellSchedules.status,
} as const;

@Injectable()
export class BellSchedulesService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async listBellSchedules(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListBellSchedulesQueryDto = {},
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getCampus(institutionId, campusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableBellScheduleColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(bellSchedules.institutionId, institutionId),
      eq(bellSchedules.campusId, campusId),
      ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
    ];

    if (query.search) {
      conditions.push(ilike(bellSchedules.name, `%${query.search}%`));
    }

    if (query.status) {
      conditions.push(eq(bellSchedules.status, query.status));
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(bellSchedules)
      .where(where);
    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.db
      .select({
        id: bellSchedules.id,
        institutionId: bellSchedules.institutionId,
        campusId: bellSchedules.campusId,
        campusName: campus.name,
        name: bellSchedules.name,
        isDefault: bellSchedules.isDefault,
        status: bellSchedules.status,
        createdAt: bellSchedules.createdAt,
        updatedAt: bellSchedules.updatedAt,
        periodCount: count(bellSchedulePeriods.id),
      })
      .from(bellSchedules)
      .innerJoin(campus, eq(bellSchedules.campusId, campus.id))
      .leftJoin(
        bellSchedulePeriods,
        and(
          eq(bellSchedulePeriods.bellScheduleId, bellSchedules.id),
          eq(bellSchedulePeriods.status, STATUS.BELL_SCHEDULE_PERIOD.ACTIVE),
        ),
      )
      .where(where)
      .groupBy(bellSchedules.id, campus.id)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(bellSchedules.name))
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => this.mapBellScheduleListRow(row)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async createBellSchedule(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateBellScheduleDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getCampus(institutionId, campusId);
    await this.assertScheduleNameAvailable(
      institutionId,
      campusId,
      payload.name,
    );

    const hasDefault = await this.hasCampusDefaultSchedule(
      institutionId,
      campusId,
    );
    const scheduleId = randomUUID();
    const shouldBeDefault = payload.isDefault === true || !hasDefault;

    await this.db.transaction(async (tx) => {
      if (shouldBeDefault) {
        await this.unsetDefaultSchedule(tx, institutionId, campusId);
      }

      await tx.insert(bellSchedules).values({
        id: scheduleId,
        institutionId,
        campusId,
        name: payload.name.trim(),
        isDefault: shouldBeDefault,
        status: STATUS.BELL_SCHEDULE.DRAFT,
      });
    });

    return this.getBellSchedule(institutionId, scheduleId, authSession, scopes);
  }

  async getBellSchedule(
    institutionId: string,
    scheduleId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);

    const schedule = await this.getScheduleRecord(
      institutionId,
      scheduleId,
      campusId,
    );
    const periods = await this.listSchedulePeriods(schedule.id);

    return {
      ...this.mapBellScheduleListRow({
        ...schedule,
        periodCount: periods.length,
      }),
      periods,
    };
  }

  async updateBellSchedule(
    institutionId: string,
    scheduleId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateBellScheduleDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    const schedule = await this.getScheduleRecord(
      institutionId,
      scheduleId,
      campusId,
    );

    if (payload.name && payload.name.trim() !== schedule.name) {
      await this.assertScheduleNameAvailable(
        institutionId,
        campusId,
        payload.name,
        scheduleId,
      );
    }

    await this.db.transaction(async (tx) => {
      if (payload.isDefault === true && !schedule.isDefault) {
        await this.unsetDefaultSchedule(tx, institutionId, campusId);
      }

      if (payload.isDefault === false && schedule.isDefault) {
        throw new ConflictException(
          ERROR_MESSAGES.BELL_SCHEDULES.DEFAULT_SCHEDULE_REQUIRED,
        );
      }

      await tx
        .update(bellSchedules)
        .set({
          ...(payload.name ? { name: payload.name.trim() } : {}),
          ...(payload.isDefault !== undefined
            ? { isDefault: payload.isDefault }
            : {}),
        })
        .where(eq(bellSchedules.id, scheduleId));
    });

    return this.getBellSchedule(institutionId, scheduleId, authSession, scopes);
  }

  async setBellScheduleStatus(
    institutionId: string,
    scheduleId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetBellScheduleStatusDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    const schedule = await this.getScheduleRecord(
      institutionId,
      scheduleId,
      campusId,
    );

    if (
      payload.status === STATUS.BELL_SCHEDULE.DELETED &&
      (await this.hasTimetableEntriesForSchedule(institutionId, scheduleId))
    ) {
      throw new ConflictException(
        ERROR_MESSAGES.BELL_SCHEDULES.SCHEDULE_HAS_TIMETABLE_ENTRIES,
      );
    }

    await this.db.transaction(async (tx) => {
      const deletingOrDisabling =
        payload.status === STATUS.BELL_SCHEDULE.DELETED ||
        payload.status === STATUS.BELL_SCHEDULE.ARCHIVED;

      if (schedule.isDefault && deletingOrDisabling) {
        const fallback = await this.findReplacementDefaultSchedule(
          tx,
          institutionId,
          campusId,
          scheduleId,
        );

        if (!fallback) {
          throw new ConflictException(
            ERROR_MESSAGES.BELL_SCHEDULES.DEFAULT_SCHEDULE_REQUIRED,
          );
        }

        await tx
          .update(bellSchedules)
          .set({ isDefault: true })
          .where(eq(bellSchedules.id, fallback.id));
      }

      await tx
        .update(bellSchedules)
        .set({
          status: payload.status,
          deletedAt:
            payload.status === STATUS.BELL_SCHEDULE.DELETED ? new Date() : null,
          isDefault:
            payload.status === STATUS.BELL_SCHEDULE.DELETED ||
            payload.status === STATUS.BELL_SCHEDULE.ARCHIVED
              ? false
              : schedule.isDefault,
        })
        .where(eq(bellSchedules.id, scheduleId));
    });

    if (payload.status === STATUS.BELL_SCHEDULE.DELETED) {
      const periods = await this.listSchedulePeriods(scheduleId);

      return {
        ...this.mapBellScheduleListRow({
          ...schedule,
          isDefault: false,
          status: STATUS.BELL_SCHEDULE.DELETED,
          periodCount: periods.length,
        }),
        periods,
      };
    }

    return this.getBellSchedule(institutionId, scheduleId, authSession, scopes);
  }

  async replaceBellSchedulePeriods(
    institutionId: string,
    scheduleId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: ReplaceBellSchedulePeriodsDto,
  ) {
    const campusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(campusId, scopes);
    await this.getScheduleRecord(institutionId, scheduleId, campusId);

    await this.db.transaction(async (tx) => {
      await tx
        .update(bellSchedulePeriods)
        .set({ status: STATUS.BELL_SCHEDULE_PERIOD.INACTIVE })
        .where(eq(bellSchedulePeriods.bellScheduleId, scheduleId));

      await tx.insert(bellSchedulePeriods).values(
        payload.periods.map((period) => ({
          id: randomUUID(),
          bellScheduleId: scheduleId,
          institutionId,
          periodIndex: period.periodIndex,
          label: period.label?.trim() || null,
          startTime: period.startTime,
          endTime: period.endTime,
          isBreak: period.isBreak ?? false,
          status: STATUS.BELL_SCHEDULE_PERIOD.ACTIVE,
        })),
      );
    });

    return this.getBellSchedule(institutionId, scheduleId, authSession, scopes);
  }

  async getActiveDefaultScheduleForCampus(
    institutionId: string,
    campusId: string,
  ) {
    const [schedule] = await this.db
      .select({
        id: bellSchedules.id,
        institutionId: bellSchedules.institutionId,
        campusId: bellSchedules.campusId,
        campusName: campus.name,
        name: bellSchedules.name,
        isDefault: bellSchedules.isDefault,
        status: bellSchedules.status,
        createdAt: bellSchedules.createdAt,
        updatedAt: bellSchedules.updatedAt,
      })
      .from(bellSchedules)
      .innerJoin(campus, eq(bellSchedules.campusId, campus.id))
      .where(
        and(
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          eq(bellSchedules.isDefault, true),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      )
      .limit(1);

    if (!schedule) {
      return null;
    }

    const periods = await this.listSchedulePeriods(schedule.id);

    return {
      ...this.mapBellScheduleListRow({
        ...schedule,
        periodCount: periods.length,
      }),
      periods,
    };
  }

  private mapBellScheduleListRow(row: {
    id: string;
    institutionId: string;
    campusId: string;
    campusName: string;
    name: string;
    isDefault: boolean;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    periodCount: number;
  }) {
    return {
      id: row.id,
      institutionId: row.institutionId,
      campusId: row.campusId,
      campusName: row.campusName,
      name: row.name,
      isDefault: row.isDefault,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      periodCount: row.periodCount,
    };
  }

  private async listSchedulePeriods(scheduleId: string) {
    const rows = await this.db
      .select({
        id: bellSchedulePeriods.id,
        periodIndex: bellSchedulePeriods.periodIndex,
        label: bellSchedulePeriods.label,
        startTime: bellSchedulePeriods.startTime,
        endTime: bellSchedulePeriods.endTime,
        isBreak: bellSchedulePeriods.isBreak,
        status: bellSchedulePeriods.status,
      })
      .from(bellSchedulePeriods)
      .where(
        and(
          eq(bellSchedulePeriods.bellScheduleId, scheduleId),
          eq(bellSchedulePeriods.status, STATUS.BELL_SCHEDULE_PERIOD.ACTIVE),
        ),
      )
      .orderBy(
        asc(bellSchedulePeriods.periodIndex),
        asc(bellSchedulePeriods.createdAt),
      );

    return rows;
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [row] = await this.db
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

    if (!row) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }
  }

  private async getScheduleRecord(
    institutionId: string,
    scheduleId: string,
    campusId: string,
  ) {
    const [row] = await this.db
      .select({
        id: bellSchedules.id,
        institutionId: bellSchedules.institutionId,
        campusId: bellSchedules.campusId,
        campusName: campus.name,
        name: bellSchedules.name,
        isDefault: bellSchedules.isDefault,
        status: bellSchedules.status,
        createdAt: bellSchedules.createdAt,
        updatedAt: bellSchedules.updatedAt,
      })
      .from(bellSchedules)
      .innerJoin(campus, eq(bellSchedules.campusId, campus.id))
      .where(
        and(
          eq(bellSchedules.id, scheduleId),
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      )
      .limit(1);

    if (!row) {
      throw new NotFoundException(
        ERROR_MESSAGES.BELL_SCHEDULES.SCHEDULE_NOT_FOUND,
      );
    }

    return row;
  }

  private async assertScheduleNameAvailable(
    institutionId: string,
    campusId: string,
    name: string,
    excludeScheduleId?: string,
  ) {
    const conditions: SQL[] = [
      eq(bellSchedules.institutionId, institutionId),
      eq(bellSchedules.campusId, campusId),
      eq(bellSchedules.name, name.trim()),
      ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
    ];

    if (excludeScheduleId) {
      conditions.push(ne(bellSchedules.id, excludeScheduleId));
    }

    const [existing] = await this.db
      .select({ id: bellSchedules.id })
      .from(bellSchedules)
      .where(and(...conditions))
      .limit(1);

    if (existing) {
      throw new ConflictException(
        ERROR_MESSAGES.BELL_SCHEDULES.SCHEDULE_NAME_EXISTS,
      );
    }
  }

  private async hasCampusDefaultSchedule(
    institutionId: string,
    campusId: string,
  ) {
    const [existing] = await this.db
      .select({ id: bellSchedules.id })
      .from(bellSchedules)
      .where(
        and(
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          eq(bellSchedules.isDefault, true),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      )
      .limit(1);

    return Boolean(existing);
  }

  private async unsetDefaultSchedule(
    tx: Pick<AppDatabase, "update">,
    institutionId: string,
    campusId: string,
  ) {
    await tx
      .update(bellSchedules)
      .set({ isDefault: false })
      .where(
        and(
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          eq(bellSchedules.isDefault, true),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      );
  }

  private async findReplacementDefaultSchedule(
    tx: Pick<AppDatabase, "select">,
    institutionId: string,
    campusId: string,
    excludedScheduleId: string,
  ) {
    const [row] = await tx
      .select({ id: bellSchedules.id })
      .from(bellSchedules)
      .where(
        and(
          eq(bellSchedules.institutionId, institutionId),
          eq(bellSchedules.campusId, campusId),
          ne(bellSchedules.id, excludedScheduleId),
          ne(bellSchedules.status, STATUS.BELL_SCHEDULE.DELETED),
        ),
      )
      .orderBy(asc(bellSchedules.createdAt))
      .limit(1);

    return row ?? null;
  }

  private async hasTimetableEntriesForSchedule(
    institutionId: string,
    scheduleId: string,
  ) {
    const periods = await this.db
      .select({ id: bellSchedulePeriods.id })
      .from(bellSchedulePeriods)
      .where(eq(bellSchedulePeriods.bellScheduleId, scheduleId));

    if (periods.length === 0) {
      return false;
    }

    const [row] = await this.db
      .select({ id: timetableEntries.id })
      .from(timetableEntries)
      .where(
        and(
          eq(timetableEntries.institutionId, institutionId),
          inArray(
            timetableEntries.bellSchedulePeriodId,
            periods.map((period) => period.id),
          ),
          ne(timetableEntries.status, STATUS.TIMETABLE.DELETED),
        ),
      )
      .limit(1);

    return Boolean(row);
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
