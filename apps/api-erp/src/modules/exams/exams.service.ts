import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import { academicYears, examMarks, examTerms, students } from "@repo/database";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES } from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import { ExamMarkDto, ExamTermDto } from "./exams.dto";
import type { CreateExamTermDto, UpsertExamMarksDto } from "./exams.schemas";

@Injectable()
export class ExamsService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listExamTerms(
    institutionId: string,
    authSession: AuthenticatedSession,
  ): Promise<ExamTermDto[]> {
    await this.requireInstitutionAccess(authSession, institutionId);

    const rows = await this.database
      .select({
        id: examTerms.id,
        institutionId: examTerms.institutionId,
        academicYearId: examTerms.academicYearId,
        academicYearName: academicYears.name,
        name: examTerms.name,
        startDate: examTerms.startDate,
        endDate: examTerms.endDate,
        createdAt: examTerms.createdAt,
      })
      .from(examTerms)
      .innerJoin(academicYears, eq(examTerms.academicYearId, academicYears.id))
      .where(
        and(
          eq(examTerms.institutionId, institutionId),
          isNull(examTerms.deletedAt),
          isNull(academicYears.deletedAt),
        ),
      )
      .orderBy(asc(examTerms.startDate), asc(examTerms.name));

    return rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createExamTerm(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateExamTermDto,
  ): Promise<ExamTermDto> {
    await this.requireInstitutionAccess(authSession, institutionId);

    const academicYear = await this.getAcademicYearOrThrow(
      institutionId,
      payload.academicYearId,
    );
    const examTermId = randomUUID();

    await this.database.insert(examTerms).values({
      id: examTermId,
      institutionId,
      academicYearId: academicYear.id,
      name: payload.name.trim(),
      startDate: payload.startDate,
      endDate: payload.endDate,
    });

    const [createdExamTerm] = (
      await this.listExamTerms(institutionId, authSession)
    ).filter((term) => term.id === examTermId);

    if (!createdExamTerm) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.TERM_NOT_FOUND);
    }

    return createdExamTerm;
  }

  async listExamMarks(
    institutionId: string,
    examTermId: string,
    authSession: AuthenticatedSession,
  ): Promise<ExamMarkDto[]> {
    await this.requireInstitutionAccess(authSession, institutionId);
    await this.getExamTermOrThrow(institutionId, examTermId);

    const rows = await this.database
      .select({
        id: examMarks.id,
        examTermId: examMarks.examTermId,
        studentId: examMarks.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        subjectName: examMarks.subjectName,
        maxMarks: examMarks.maxMarks,
        obtainedMarks: examMarks.obtainedMarks,
        remarks: examMarks.remarks,
        createdAt: examMarks.createdAt,
      })
      .from(examMarks)
      .innerJoin(students, eq(examMarks.studentId, students.id))
      .where(
        and(
          eq(examMarks.institutionId, institutionId),
          eq(examMarks.examTermId, examTermId),
          isNull(students.deletedAt),
        ),
      )
      .orderBy(
        asc(students.firstName),
        asc(students.lastName),
        asc(examMarks.subjectName),
      );

    return rows.map((row) => ({
      id: row.id,
      examTermId: row.examTermId,
      studentId: row.studentId,
      studentFullName: [row.studentFirstName, row.studentLastName]
        .filter(Boolean)
        .join(" "),
      admissionNumber: row.admissionNumber,
      subjectName: row.subjectName,
      maxMarks: row.maxMarks,
      obtainedMarks: row.obtainedMarks,
      remarks: row.remarks,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async replaceExamMarks(
    institutionId: string,
    examTermId: string,
    authSession: AuthenticatedSession,
    payload: UpsertExamMarksDto,
  ): Promise<ExamMarkDto[]> {
    await this.requireInstitutionAccess(authSession, institutionId);
    await this.getExamTermOrThrow(institutionId, examTermId);
    await this.assertStudentsBelongToInstitution(
      institutionId,
      payload.entries.map((entry) => entry.studentId),
    );

    await this.database.transaction(async (tx) => {
      await tx.delete(examMarks).where(eq(examMarks.examTermId, examTermId));

      if (payload.entries.length === 0) {
        return;
      }

      await tx.insert(examMarks).values(
        payload.entries.map((entry) => ({
          id: randomUUID(),
          institutionId,
          examTermId,
          studentId: entry.studentId,
          subjectName: entry.subjectName.trim(),
          maxMarks: entry.maxMarks,
          obtainedMarks: entry.obtainedMarks,
          remarks: entry.remarks?.trim() || null,
        })),
      );
    });

    return this.listExamMarks(institutionId, examTermId, authSession);
  }

  private async getAcademicYearOrThrow(
    institutionId: string,
    academicYearId: string,
  ) {
    const [academicYear] = await this.database
      .select({
        id: academicYears.id,
      })
      .from(academicYears)
      .where(
        and(
          eq(academicYears.id, academicYearId),
          eq(academicYears.institutionId, institutionId),
          isNull(academicYears.deletedAt),
        ),
      )
      .limit(1);

    if (!academicYear) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.ACADEMIC_YEAR_REQUIRED);
    }

    return academicYear;
  }

  private async getExamTermOrThrow(institutionId: string, examTermId: string) {
    const [examTerm] = await this.database
      .select({
        id: examTerms.id,
      })
      .from(examTerms)
      .where(
        and(
          eq(examTerms.id, examTermId),
          eq(examTerms.institutionId, institutionId),
          isNull(examTerms.deletedAt),
        ),
      )
      .limit(1);

    if (!examTerm) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.TERM_NOT_FOUND);
    }

    return examTerm;
  }

  private async assertStudentsBelongToInstitution(
    institutionId: string,
    studentIds: string[],
  ) {
    if (studentIds.length === 0) {
      return;
    }

    const distinctStudentIds = Array.from(new Set(studentIds));
    const rows = await this.database
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.institutionId, institutionId),
          inArray(students.id, distinctStudentIds),
          isNull(students.deletedAt),
        ),
      );

    if (rows.length !== distinctStudentIds.length) {
      throw new BadRequestException(ERROR_MESSAGES.EXAMS.STUDENT_REQUIRED);
    }
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
}
