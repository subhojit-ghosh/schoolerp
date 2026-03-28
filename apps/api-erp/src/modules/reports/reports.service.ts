import { Inject, Injectable } from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  campus,
  classSections,
  count,
  eq,
  isNull,
  schoolClasses,
  sql,
  studentCurrentEnrollments,
} from "@repo/database";
import { STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter } from "../auth/scope-filter";
import type { StudentStrengthQueryInput } from "./reports.schemas";
import type { SQL } from "@repo/database";

@Injectable()
export class ReportsService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  async getStudentStrength(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: StudentStrengthQueryInput,
  ) {
    const scopedCampusId = authSession.activeCampusId ?? undefined;
    const conditions: SQL[] = [
      eq(studentCurrentEnrollments.institutionId, institutionId),
      isNull(studentCurrentEnrollments.deletedAt),
    ];

    if (query.academicYearId) {
      conditions.push(
        eq(studentCurrentEnrollments.academicYearId, query.academicYearId),
      );
    }

    if (query.campusId) {
      conditions.push(eq(schoolClasses.campusId, query.campusId));
    } else if (scopedCampusId) {
      conditions.push(eq(schoolClasses.campusId, scopedCampusId));
    } else {
      const campusFilter = campusScopeFilter(schoolClasses.campusId, scopes);

      if (campusFilter) {
        conditions.push(campusFilter);
      }
    }

    conditions.push(
      eq(schoolClasses.status, STATUS.CLASS.ACTIVE),
      eq(classSections.status, STATUS.SECTION.ACTIVE),
    );

    const rows = await this.database
      .select({
        classId: schoolClasses.id,
        className: schoolClasses.name,
        sectionId: classSections.id,
        sectionName: classSections.name,
        campusName: campus.name,
        totalCount: count(studentCurrentEnrollments.id),
      })
      .from(studentCurrentEnrollments)
      .innerJoin(
        schoolClasses,
        eq(studentCurrentEnrollments.classId, schoolClasses.id),
      )
      .innerJoin(
        classSections,
        eq(studentCurrentEnrollments.sectionId, classSections.id),
      )
      .leftJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(and(...conditions))
      .groupBy(
        schoolClasses.id,
        schoolClasses.name,
        schoolClasses.displayOrder,
        classSections.id,
        classSections.name,
        classSections.displayOrder,
        campus.name,
      )
      .orderBy(
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
        asc(classSections.displayOrder),
        asc(classSections.name),
      );

    const grandTotal = rows.reduce(
      (sum, row) => sum + Number(row.totalCount),
      0,
    );

    return {
      rows: rows.map((row) => ({
        classId: row.classId,
        className: row.className,
        sectionId: row.sectionId,
        sectionName: row.sectionName,
        campusName: row.campusName,
        totalCount: Number(row.totalCount),
      })),
      grandTotal,
    };
  }
}
