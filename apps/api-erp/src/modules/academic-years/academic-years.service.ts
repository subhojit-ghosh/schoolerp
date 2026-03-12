import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@academic-platform/backend-core";
import { academicYears } from "@academic-platform/database";
import { and, desc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AppDatabase } from "@academic-platform/database";
import { Inject } from "@nestjs/common";
import { AcademicYearDto } from "./academic-years.dto";
import type { CreateAcademicYearDto } from "./academic-years.schemas";

@Injectable()
export class AcademicYearsService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  async listAcademicYears(institutionId: string): Promise<AcademicYearDto[]> {
    const rows = await this.database
      .select({
        id: academicYears.id,
        name: academicYears.name,
        startDate: academicYears.startDate,
        endDate: academicYears.endDate,
        isCurrent: academicYears.isCurrent,
        status: academicYears.status,
        createdAt: academicYears.createdAt,
      })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.institutionId, institutionId),
          isNull(academicYears.deletedAt),
        ),
      )
      .orderBy(desc(academicYears.isCurrent), desc(academicYears.startDate));

    return rows.map((row) => ({
      ...row,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createAcademicYear(
    institutionId: string,
    payload: CreateAcademicYearDto,
  ): Promise<void> {
    const [existingCurrent] = await this.database
      .select({ id: academicYears.id })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.institutionId, institutionId),
          eq(academicYears.isCurrent, true),
          isNull(academicYears.deletedAt),
        ),
      )
      .limit(1);

    const shouldMakeCurrent = payload.makeCurrent || !existingCurrent;

    if (shouldMakeCurrent) {
      await this.database
        .update(academicYears)
        .set({ isCurrent: false })
        .where(
          and(
            eq(academicYears.institutionId, institutionId),
            isNull(academicYears.deletedAt),
          ),
        );
    }

    await this.database.insert(academicYears).values({
      id: randomUUID(),
      institutionId,
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      isCurrent: shouldMakeCurrent,
      status: STATUS.ACADEMIC_YEAR.ACTIVE,
    });
  }

  async setCurrentAcademicYear(
    institutionId: string,
    academicYearId: string,
  ): Promise<void> {
    await this.getAcademicYearOrThrow(academicYearId, institutionId);

    await this.database
      .update(academicYears)
      .set({ isCurrent: false })
      .where(
        and(
          eq(academicYears.institutionId, institutionId),
          isNull(academicYears.deletedAt),
        ),
      );

    await this.database
      .update(academicYears)
      .set({
        isCurrent: true,
        status: STATUS.ACADEMIC_YEAR.ACTIVE,
      })
      .where(eq(academicYears.id, academicYearId));
  }

  async archiveAcademicYear(
    institutionId: string,
    academicYearId: string,
  ): Promise<void> {
    const year = await this.getAcademicYearOrThrow(
      academicYearId,
      institutionId,
    );

    if (year.isCurrent) {
      throw new BadRequestException(
        ERROR_MESSAGES.ACADEMIC_YEARS.CURRENT_YEAR_REQUIRED,
      );
    }

    await this.database
      .update(academicYears)
      .set({ status: STATUS.ACADEMIC_YEAR.ARCHIVED })
      .where(eq(academicYears.id, academicYearId));
  }

  async restoreAcademicYear(
    institutionId: string,
    academicYearId: string,
  ): Promise<void> {
    await this.getAcademicYearOrThrow(academicYearId, institutionId);

    await this.database
      .update(academicYears)
      .set({ status: STATUS.ACADEMIC_YEAR.ACTIVE })
      .where(eq(academicYears.id, academicYearId));
  }

  private async getAcademicYearOrThrow(
    academicYearId: string,
    institutionId: string,
  ) {
    const [year] = await this.database
      .select({
        id: academicYears.id,
        isCurrent: academicYears.isCurrent,
        status: academicYears.status,
        deletedAt: academicYears.deletedAt,
      })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.id, academicYearId),
          eq(academicYears.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (!year || year.deletedAt !== null) {
      throw new NotFoundException(ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND);
    }

    return year;
  }
}
