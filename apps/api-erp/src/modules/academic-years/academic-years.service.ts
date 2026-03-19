import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  academicYears,
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  ne,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import type { AppDatabase } from "@repo/database";
import { Inject } from "@nestjs/common";
import {
  AcademicYearDto,
  ListAcademicYearsResultDto,
} from "./academic-years.dto";
import type {
  CreateAcademicYearDto,
  ListAcademicYearsQueryDto,
  UpdateAcademicYearDto,
} from "./academic-years.schemas";
import { sortableAcademicYearColumns } from "./academic-years.schemas";
import type { AuthenticatedSession } from "../auth/auth.types";

type AcademicYearRecord = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  status: AcademicYearDto["status"];
  createdAt: Date;
};

const sortableColumns = {
  current: academicYears.isCurrent,
  endDate: academicYears.endDate,
  name: academicYears.name,
  startDate: academicYears.startDate,
} as const;

@Injectable()
export class AcademicYearsService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  async listAcademicYears(
    institutionId: string,
    authSession: AuthenticatedSession,
    query: ListAcademicYearsQueryDto = {},
  ): Promise<ListAcademicYearsResultDto> {
    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableAcademicYearColumns.startDate;
    const sortDirection = query.order === SORT_ORDERS.ASC ? asc : desc;
    const conditions: SQL[] = [
      eq(academicYears.institutionId, institutionId),
      ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
    ];

    if (query.search) {
      conditions.push(ilike(academicYears.name, `%${query.search}%`));
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.database
      .select({ count: count() })
      .from(academicYears)
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const rows = await this.database
      .select(this.academicYearSelect)
      .from(academicYears)
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        desc(academicYears.isCurrent),
        desc(academicYears.startDate),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    return {
      rows: rows.map((row) => this.toAcademicYearDto(row)),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getAcademicYear(
    institutionId: string,
    academicYearId: string,
    _authSession: AuthenticatedSession,
  ): Promise<AcademicYearDto> {
    return this.getAcademicYearOrThrow(academicYearId, institutionId);
  }

  async createAcademicYear(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateAcademicYearDto,
  ): Promise<AcademicYearDto> {
    const academicYearId = randomUUID();

    return this.database.transaction(async (tx) => {
      const [existingCurrent] = await tx
        .select({ id: academicYears.id })
        .from(academicYears)
        .where(
          and(
            eq(academicYears.institutionId, institutionId),
            eq(academicYears.isCurrent, true),
            ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
          ),
        )
        .limit(1);

      const shouldMakeCurrent = payload.isCurrent || !existingCurrent;

      if (shouldMakeCurrent) {
        await tx
          .update(academicYears)
          .set({ isCurrent: false })
          .where(
            and(
              eq(academicYears.institutionId, institutionId),
              ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
            ),
          );
      }

      await tx.insert(academicYears).values({
        id: academicYearId,
        institutionId,
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        isCurrent: shouldMakeCurrent,
        status: STATUS.ACADEMIC_YEAR.ACTIVE,
      });

      const createdYear = await this.getAcademicYearByIdOrThrow(
        tx,
        academicYearId,
        institutionId,
      );

      return this.toAcademicYearDto(createdYear);
    });
  }

  async updateAcademicYear(
    institutionId: string,
    academicYearId: string,
    authSession: AuthenticatedSession,
    payload: UpdateAcademicYearDto,
  ): Promise<AcademicYearDto> {
    return this.database.transaction(async (tx) => {
      const existingYear = await this.getAcademicYearByIdOrThrow(
        tx,
        academicYearId,
        institutionId,
      );

      if (existingYear.isCurrent && !payload.isCurrent) {
        throw new BadRequestException(
          ERROR_MESSAGES.ACADEMIC_YEARS.CURRENT_YEAR_REQUIRED,
        );
      }

      if (payload.isCurrent) {
        await tx
          .update(academicYears)
          .set({ isCurrent: false })
          .where(
            and(
              eq(academicYears.institutionId, institutionId),
              ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
            ),
          );
      }

      await tx
        .update(academicYears)
        .set({
          name: payload.name,
          startDate: payload.startDate,
          endDate: payload.endDate,
          isCurrent: payload.isCurrent,
        })
        .where(eq(academicYears.id, academicYearId));

      const updatedYear = await this.getAcademicYearByIdOrThrow(
        tx,
        academicYearId,
        institutionId,
      );

      return this.toAcademicYearDto(updatedYear);
    });
  }

  private async getAcademicYearOrThrow(
    academicYearId: string,
    institutionId: string,
  ): Promise<AcademicYearDto> {
    const year = await this.getAcademicYearByIdOrThrow(
      this.database,
      academicYearId,
      institutionId,
    );

    return this.toAcademicYearDto(year);
  }

  private readonly academicYearSelect = {
    id: academicYears.id,
    name: academicYears.name,
    startDate: academicYears.startDate,
    endDate: academicYears.endDate,
    isCurrent: academicYears.isCurrent,
    status: academicYears.status,
    createdAt: academicYears.createdAt,
  };

  private toAcademicYearDto(row: AcademicYearRecord): AcademicYearDto {
    return {
      ...row,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private async getAcademicYearByIdOrThrow(
    databaseClient: Pick<AppDatabase, "select">,
    academicYearId: string,
    institutionId: string,
  ): Promise<AcademicYearRecord> {
    const [year] = await databaseClient
      .select(this.academicYearSelect)
      .from(academicYears)
      .where(
        and(
          eq(academicYears.id, academicYearId),
          eq(academicYears.institutionId, institutionId),
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
        ),
      )
      .limit(1);

    if (!year) {
      throw new NotFoundException(ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND);
    }

    return year;
  }
}
