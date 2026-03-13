import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import { academicYears } from "@repo/database";
import { and, desc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AppDatabase } from "@repo/database";
import { Inject } from "@nestjs/common";
import { AcademicYearDto } from "./academic-years.dto";
import type {
  CreateAcademicYearDto,
  UpdateAcademicYearDto,
} from "./academic-years.schemas";
import { AuthService } from "../auth/auth.service";
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

@Injectable()
export class AcademicYearsService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listAcademicYears(
    institutionId: string,
    authSession: AuthenticatedSession,
  ): Promise<AcademicYearDto[]> {
    await this.requireInstitutionAccess(authSession, institutionId);

    const rows = await this.database
      .select(this.academicYearSelect)
      .from(academicYears)
      .where(
        and(
          eq(academicYears.institutionId, institutionId),
          isNull(academicYears.deletedAt),
        ),
      )
      .orderBy(desc(academicYears.isCurrent), desc(academicYears.startDate));

    return rows.map((row) => this.toAcademicYearDto(row));
  }

  async getAcademicYear(
    institutionId: string,
    academicYearId: string,
    authSession: AuthenticatedSession,
  ): Promise<AcademicYearDto> {
    await this.requireInstitutionAccess(authSession, institutionId);

    return this.getAcademicYearOrThrow(academicYearId, institutionId);
  }

  async createAcademicYear(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateAcademicYearDto,
  ): Promise<AcademicYearDto> {
    await this.requireInstitutionAccess(authSession, institutionId);
    const academicYearId = randomUUID();

    return this.database.transaction(async (tx) => {
      const [existingCurrent] = await tx
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

      const shouldMakeCurrent = payload.isCurrent || !existingCurrent;

      if (shouldMakeCurrent) {
        await tx
          .update(academicYears)
          .set({ isCurrent: false })
          .where(
            and(
              eq(academicYears.institutionId, institutionId),
              isNull(academicYears.deletedAt),
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
    await this.requireInstitutionAccess(authSession, institutionId);

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
              isNull(academicYears.deletedAt),
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

  private async requireInstitutionAccess(
    authSession: AuthenticatedSession,
    institutionId: string,
  ) {
    await this.authService.requireOrganizationContext(
      authSession,
      institutionId,
      AUTH_CONTEXT_KEYS.STAFF,
    );
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
          isNull(academicYears.deletedAt),
        ),
      )
      .limit(1);

    if (!year) {
      throw new NotFoundException(ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND);
    }

    return year;
  }
}
