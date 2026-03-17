import { DATABASE } from "@repo/backend-core";
import {
  STUDENT_ROLLOVER_ACTIONS,
  STUDENT_ROLLOVER_PREVIEW_STATUS,
} from "@repo/contracts";
import {
  BadRequestException,
  Inject,
  Injectable,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  campus,
  campusMemberships,
  classSections,
  member,
  schoolClasses,
  studentCurrentEnrollments,
  students,
} from "@repo/database";
import {
  and,
  asc,
  eq,
  inArray,
  isNull,
  ne,
} from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter, sectionScopeFilter } from "../auth/scope-filter";
import type {
  StudentRolloverAcademicYearDto,
  StudentRolloverExecuteDto,
  StudentRolloverPlacementDto,
  StudentRolloverPreviewDto,
  StudentRolloverPreviewSectionDto,
  StudentRolloverPreviewStudentDto,
} from "./student-rollover.dto";
import type {
  StudentRolloverRequestDto,
  StudentRolloverSectionMappingDto,
} from "./student-rollover.schemas";

type AcademicYearRecord = StudentRolloverAcademicYearDto & {
  status: string;
};

type RolloverSourceStudentRow = {
  studentId: string;
  membershipId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  sourceClassId: string;
  sourceClassName: string;
  sourceSectionId: string;
  sourceSectionName: string;
  sourceCampusId: string;
  sourceCampusName: string;
};

type StudentRolloverWriter = Pick<
  AppDatabase,
  "insert" | "select" | "transaction" | "update"
>;

@Injectable()
export class StudentRolloverService {
  constructor(@Inject(DATABASE) private readonly db: AppDatabase) {}

  async preview(
    institutionId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: StudentRolloverRequestDto,
  ): Promise<StudentRolloverPreviewDto> {
    return this.buildPreview(institutionId, scopes, payload);
  }

  async execute(
    institutionId: string,
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: StudentRolloverRequestDto,
  ): Promise<StudentRolloverExecuteDto> {
    const preview = await this.buildPreview(institutionId, scopes, payload);

    if (preview.summary.unmappedStudentCount > 0) {
      throw new BadRequestException(
        ERROR_MESSAGES.STUDENTS.ROLLOVER_UNMAPPED_STUDENTS,
      );
    }

    await this.db.transaction(async (tx) => {
      for (const section of preview.sections) {
        for (const student of section.students) {
          if (student.action === STUDENT_ROLLOVER_ACTIONS.WITHDRAW) {
            await tx
              .update(member)
              .set({
                status: STATUS.MEMBER.INACTIVE,
              })
              .where(eq(member.id, student.membershipId));

            await tx
              .update(studentCurrentEnrollments)
              .set({
                deletedAt: new Date(),
              })
              .where(
                and(
                  eq(
                    studentCurrentEnrollments.studentMembershipId,
                    student.membershipId,
                  ),
                  eq(studentCurrentEnrollments.institutionId, institutionId),
                  isNull(studentCurrentEnrollments.deletedAt),
                ),
              );

            continue;
          }

          if (!student.target) {
            continue;
          }

          await tx
            .update(member)
            .set({
              primaryCampusId: student.target.campusId,
              status: STATUS.MEMBER.ACTIVE,
            })
            .where(eq(member.id, student.membershipId));

          await this.ensureCampusMembership(
            tx,
            student.membershipId,
            student.target.campusId,
          );

          await tx
            .update(students)
            .set({
              classId: student.target.classId,
              sectionId: student.target.sectionId,
            })
            .where(eq(students.id, student.studentId));

          await tx
            .update(studentCurrentEnrollments)
            .set({
              academicYearId: payload.targetAcademicYearId,
              classId: student.target.classId,
              sectionId: student.target.sectionId,
              deletedAt: null,
            })
            .where(
              and(
                eq(
                  studentCurrentEnrollments.studentMembershipId,
                  student.membershipId,
                ),
                eq(studentCurrentEnrollments.institutionId, institutionId),
                isNull(studentCurrentEnrollments.deletedAt),
              ),
            );
        }
      }
    });

    return {
      ...preview,
      executedAt: new Date().toISOString(),
    };
  }

  private async buildPreview(
    institutionId: string,
    scopes: ResolvedScopes,
    payload: StudentRolloverRequestDto,
  ): Promise<StudentRolloverPreviewDto> {
    const [sourceAcademicYear, targetAcademicYear] = await Promise.all([
      this.getAcademicYear(institutionId, payload.sourceAcademicYearId, false),
      this.getAcademicYear(institutionId, payload.targetAcademicYearId, true),
    ]);

    const sourceStudents = await this.listSourceStudents(
      institutionId,
      payload.sourceAcademicYearId,
      scopes,
    );

    const targetPlacements = await this.getTargetPlacements(
      institutionId,
      payload.sectionMappings,
    );
    const withdrawnStudentIds = new Set(payload.withdrawnStudentIds);

    const sectionsBySource = new Map<string, StudentRolloverPreviewSectionDto>();

    for (const student of sourceStudents) {
      const sourceKey = this.getSourceKey(
        student.sourceClassId,
        student.sourceSectionId,
      );
      const mapping = payload.sectionMappings.find(
        (item) =>
          item.sourceClassId === student.sourceClassId &&
          item.sourceSectionId === student.sourceSectionId,
      );
      const target =
        mapping &&
        targetPlacements.get(
          this.getTargetKey(mapping.targetClassId, mapping.targetSectionId),
        )
          ? targetPlacements.get(
              this.getTargetKey(mapping.targetClassId, mapping.targetSectionId),
            )!
          : null;

      const action = withdrawnStudentIds.has(student.studentId)
        ? STUDENT_ROLLOVER_ACTIONS.WITHDRAW
        : STUDENT_ROLLOVER_ACTIONS.CONTINUE;
      const status =
        action === STUDENT_ROLLOVER_ACTIONS.WITHDRAW
          ? STUDENT_ROLLOVER_PREVIEW_STATUS.WITHDRAWN
          : target
            ? STUDENT_ROLLOVER_PREVIEW_STATUS.MAPPED
            : STUDENT_ROLLOVER_PREVIEW_STATUS.UNMAPPED;

      const previewStudent: StudentRolloverPreviewStudentDto = {
        studentId: student.studentId,
        membershipId: student.membershipId,
        admissionNumber: student.admissionNumber,
        fullName: [student.firstName, student.lastName].filter(Boolean).join(" "),
        action,
        status,
        source: {
          classId: student.sourceClassId,
          className: student.sourceClassName,
          sectionId: student.sourceSectionId,
          sectionName: student.sourceSectionName,
          campusId: student.sourceCampusId,
          campusName: student.sourceCampusName,
        },
        target,
      };

      const currentSection = sectionsBySource.get(sourceKey);

      if (currentSection) {
        currentSection.studentCount += 1;
        currentSection.students.push(previewStudent);
        continue;
      }

      sectionsBySource.set(sourceKey, {
        sourceClassId: student.sourceClassId,
        sourceClassName: student.sourceClassName,
        sourceSectionId: student.sourceSectionId,
        sourceSectionName: student.sourceSectionName,
        sourceCampusId: student.sourceCampusId,
        sourceCampusName: student.sourceCampusName,
        studentCount: 1,
        mapping: target,
        students: [previewStudent],
      });
    }

    const sections = Array.from(sectionsBySource.values()).sort((left, right) =>
      `${left.sourceClassName}-${left.sourceSectionName}`.localeCompare(
        `${right.sourceClassName}-${right.sourceSectionName}`,
      ),
    );

    return {
      sourceAcademicYear,
      targetAcademicYear,
      summary: {
        eligibleStudentCount: sourceStudents.length,
        mappedStudentCount: sections.reduce(
          (count, section) =>
            count +
            section.students.filter(
              (student) =>
                student.status === STUDENT_ROLLOVER_PREVIEW_STATUS.MAPPED,
            ).length,
          0,
        ),
        unmappedStudentCount: sections.reduce(
          (count, section) =>
            count +
            section.students.filter(
              (student) =>
                student.status === STUDENT_ROLLOVER_PREVIEW_STATUS.UNMAPPED,
            ).length,
          0,
        ),
        withdrawnStudentCount: sections.reduce(
          (count, section) =>
            count +
            section.students.filter(
              (student) =>
                student.status === STUDENT_ROLLOVER_PREVIEW_STATUS.WITHDRAWN,
            ).length,
          0,
        ),
        sourceSectionCount: sections.length,
        mappedSectionCount: sections.filter((section) => section.mapping).length,
      },
      sections,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getAcademicYear(
    institutionId: string,
    academicYearId: string,
    requireActiveTarget: boolean,
  ): Promise<StudentRolloverAcademicYearDto> {
    const [matchedAcademicYear] = await this.db
      .select({
        id: academicYears.id,
        name: academicYears.name,
        status: academicYears.status,
      })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.id, academicYearId),
          eq(academicYears.institutionId, institutionId),
          requireActiveTarget
            ? eq(academicYears.status, STATUS.ACADEMIC_YEAR.ACTIVE)
            : ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
        ),
      )
      .limit(1);

    if (!matchedAcademicYear) {
      throw new BadRequestException(
        requireActiveTarget
          ? ERROR_MESSAGES.STUDENTS.ROLLOVER_TARGET_YEAR_REQUIRED
          : ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND,
      );
    }

    return {
      id: matchedAcademicYear.id,
      name: matchedAcademicYear.name,
    };
  }

  private async listSourceStudents(
    institutionId: string,
    sourceAcademicYearId: string,
    scopes: ResolvedScopes,
  ) {
    return this.db
      .select({
        studentId: students.id,
        membershipId: member.id,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        sourceClassId: schoolClasses.id,
        sourceClassName: schoolClasses.name,
        sourceSectionId: classSections.id,
        sourceSectionName: classSections.name,
        sourceCampusId: campus.id,
        sourceCampusName: campus.name,
      })
      .from(studentCurrentEnrollments)
      .innerJoin(
        member,
        eq(studentCurrentEnrollments.studentMembershipId, member.id),
      )
      .innerJoin(students, eq(students.membershipId, member.id))
      .innerJoin(
        schoolClasses,
        eq(studentCurrentEnrollments.classId, schoolClasses.id),
      )
      .innerJoin(
        classSections,
        eq(studentCurrentEnrollments.sectionId, classSections.id),
      )
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(
        and(
          eq(studentCurrentEnrollments.institutionId, institutionId),
          eq(studentCurrentEnrollments.academicYearId, sourceAcademicYearId),
          isNull(studentCurrentEnrollments.deletedAt),
          eq(member.status, STATUS.MEMBER.ACTIVE),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          campusScopeFilter(campus.id, scopes),
          sectionScopeFilter(classSections.id, scopes),
        ),
      )
      .orderBy(
        asc(campus.name),
        asc(schoolClasses.name),
        asc(classSections.name),
        asc(students.firstName),
        asc(students.lastName),
      );
  }

  private async getTargetPlacements(
    institutionId: string,
    mappings: StudentRolloverSectionMappingDto[],
  ) {
    const targetClassIds = Array.from(
      new Set(mappings.map((mapping) => mapping.targetClassId)),
    );
    const targetSectionIds = Array.from(
      new Set(mappings.map((mapping) => mapping.targetSectionId)),
    );

    if (targetClassIds.length === 0 || targetSectionIds.length === 0) {
      return new Map<string, StudentRolloverPlacementDto>();
    }

    const rows = await this.db
      .select({
        classId: schoolClasses.id,
        className: schoolClasses.name,
        sectionId: classSections.id,
        sectionName: classSections.name,
        campusId: campus.id,
        campusName: campus.name,
      })
      .from(classSections)
      .innerJoin(schoolClasses, eq(classSections.classId, schoolClasses.id))
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          inArray(schoolClasses.id, targetClassIds),
          inArray(classSections.id, targetSectionIds),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );

    return new Map(
      rows.map((row) => [
        this.getTargetKey(row.classId, row.sectionId),
        {
          classId: row.classId,
          className: row.className,
          sectionId: row.sectionId,
          sectionName: row.sectionName,
          campusId: row.campusId,
          campusName: row.campusName,
        },
      ]),
    );
  }

  private async ensureCampusMembership(
    tx: StudentRolloverWriter,
    membershipId: string,
    campusId: string,
  ) {
    const [matchedCampusMembership] = await tx
      .select({ id: campusMemberships.id })
      .from(campusMemberships)
      .where(
        and(
          eq(campusMemberships.membershipId, membershipId),
          eq(campusMemberships.campusId, campusId),
          isNull(campusMemberships.deletedAt),
        ),
      )
      .limit(1);

    if (!matchedCampusMembership) {
      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId,
        campusId,
      });
    }
  }

  private getSourceKey(classId: string, sectionId: string) {
    return `${classId}:${sectionId}`;
  }

  private getTargetKey(classId: string, sectionId: string) {
    return `${classId}:${sectionId}`;
  }
}
