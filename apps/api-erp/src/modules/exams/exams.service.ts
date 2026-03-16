import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  examMarks,
  examTerms,
  member,
  students,
} from "@repo/database";
import { and, asc, eq, inArray, isNull, ne } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import { ExamMarkDto, ExamReportCardDto, ExamTermDto } from "./exams.dto";
import type {
  CreateExamTermDto,
  ExamReportCardQueryDto,
  UpsertExamMarksDto,
} from "./exams.schemas";

const EXAM_GRADING_SCHEME = [
  { grade: "A1", minPercent: 90, label: "Outstanding" },
  { grade: "A2", minPercent: 80, label: "Excellent" },
  { grade: "B1", minPercent: 70, label: "Very Good" },
  { grade: "B2", minPercent: 60, label: "Good" },
  { grade: "C1", minPercent: 50, label: "Satisfactory" },
  { grade: "C2", minPercent: 40, label: "Needs Improvement" },
  { grade: "D", minPercent: 33, label: "Pass" },
  { grade: "E", minPercent: 0, label: "Needs Support" },
] as const;

@Injectable()
export class ExamsService {
  constructor(@Inject(DATABASE) private readonly database: AppDatabase) {}

  async listExamTerms(
    institutionId: string,
    _authSession: AuthenticatedSession,
  ): Promise<ExamTermDto[]> {
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
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
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
    _authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ): Promise<ExamMarkDto[]> {
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
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(examMarks.institutionId, institutionId),
          eq(examMarks.examTermId, examTermId),
          ne(member.status, STATUS.MEMBER.DELETED),
          sectionScopeFilter(students.sectionId, scopes),
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

  async getExamReportCard(
    institutionId: string,
    examTermId: string,
    query: ExamReportCardQueryDto,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ): Promise<ExamReportCardDto> {
    const examTerm = await this.getExamTermWithYearOrThrow(
      institutionId,
      examTermId,
    );

    const [studentRow] = await this.database
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNumber: students.admissionNumber,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.id, query.studentId),
          ne(member.status, STATUS.MEMBER.DELETED),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .limit(1);

    if (!studentRow) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    const subjectRows = await this.database
      .select({
        subjectName: examMarks.subjectName,
        maxMarks: examMarks.maxMarks,
        obtainedMarks: examMarks.obtainedMarks,
        remarks: examMarks.remarks,
      })
      .from(examMarks)
      .where(
        and(
          eq(examMarks.institutionId, institutionId),
          eq(examMarks.examTermId, examTermId),
          eq(examMarks.studentId, query.studentId),
        ),
      )
      .orderBy(asc(examMarks.subjectName));

    const subjects = subjectRows.map((row) => {
      const percent = this.roundPercent(
        this.toPercent(row.obtainedMarks, row.maxMarks),
      );
      return {
        subjectName: row.subjectName,
        maxMarks: row.maxMarks,
        obtainedMarks: row.obtainedMarks,
        percent,
        grade: this.resolveGrade(percent),
        remarks: row.remarks,
      };
    });

    const totalMaxMarks = subjects.reduce((sum, row) => sum + row.maxMarks, 0);
    const totalObtainedMarks = subjects.reduce(
      (sum, row) => sum + row.obtainedMarks,
      0,
    );
    const overallPercent = this.roundPercent(
      this.toPercent(totalObtainedMarks, totalMaxMarks),
    );

    return {
      examTermId: examTerm.id,
      examTermName: examTerm.name,
      academicYearId: examTerm.academicYearId,
      academicYearName: examTerm.academicYearName,
      studentId: studentRow.id,
      studentFullName: [studentRow.firstName, studentRow.lastName]
        .filter(Boolean)
        .join(" "),
      admissionNumber: studentRow.admissionNumber,
      summary: {
        totalMaxMarks,
        totalObtainedMarks,
        overallPercent,
        overallGrade: this.resolveGrade(overallPercent),
      },
      subjects,
      gradingScheme: EXAM_GRADING_SCHEME.map((band) => ({
        grade: band.grade,
        minPercent: band.minPercent,
        label: band.label,
      })),
    };
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
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
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

  private async getExamTermWithYearOrThrow(
    institutionId: string,
    examTermId: string,
  ) {
    const [examTerm] = await this.database
      .select({
        id: examTerms.id,
        academicYearId: examTerms.academicYearId,
        academicYearName: academicYears.name,
        name: examTerms.name,
      })
      .from(examTerms)
      .innerJoin(academicYears, eq(examTerms.academicYearId, academicYears.id))
      .where(
        and(
          eq(examTerms.id, examTermId),
          eq(examTerms.institutionId, institutionId),
          isNull(examTerms.deletedAt),
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
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
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          inArray(students.id, distinctStudentIds),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      );

    if (rows.length !== distinctStudentIds.length) {
      throw new BadRequestException(ERROR_MESSAGES.EXAMS.STUDENT_REQUIRED);
    }
  }

  private toPercent(obtainedMarks: number, maxMarks: number) {
    if (maxMarks <= 0) {
      return 0;
    }

    return (obtainedMarks / maxMarks) * 100;
  }

  private roundPercent(value: number) {
    return Number(value.toFixed(2));
  }

  private resolveGrade(percent: number) {
    const matchedBand = EXAM_GRADING_SCHEME.find(
      (band) => percent >= band.minPercent,
    );
    if (matchedBand) {
      return matchedBand.grade;
    }

    return "E";
  }
}
