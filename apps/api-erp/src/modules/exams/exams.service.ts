import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  AUDIT_ACTIONS,
  AUDIT_ENTITY_TYPES,
  NOTIFICATION_TYPES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TONES,
} from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  desc,
  eq,
  examMarks,
  examTerms,
  gradingScaleBands,
  gradingScales,
  inArray,
  isNull,
  member,
  ne,
  students,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuditService } from "../audit/audit.service";
import { NotificationFactory } from "../communications/notification.factory";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { sectionScopeFilter } from "../auth/scope-filter";
import type {
  ExamMarkDto,
  ExamReportCardDto,
  ExamTermDto,
  GradingScaleDto,
  ClassAnalysisDto,
  RanksDto,
} from "./exams.dto";
import type {
  BatchReportCardsQueryDto,
  ClassAnalysisQueryDto,
  CreateExamTermDto,
  CreateGradingScaleDto,
  ExamReportCardQueryDto,
  RanksQueryDto,
  UpdateGradingScaleDto,
  UpsertExamMarksDto,
} from "./exams.schemas";

type GradeBand = { grade: string; minPercent: number; label: string };

// Fallback grading scheme used only when no DB scale exists
const FALLBACK_GRADING_SCHEME: GradeBand[] = [
  { grade: "A1", minPercent: 90, label: "Outstanding" },
  { grade: "A2", minPercent: 80, label: "Excellent" },
  { grade: "B1", minPercent: 70, label: "Very Good" },
  { grade: "B2", minPercent: 60, label: "Good" },
  { grade: "C1", minPercent: 50, label: "Satisfactory" },
  { grade: "C2", minPercent: 40, label: "Needs Improvement" },
  { grade: "D", minPercent: 33, label: "Pass" },
  { grade: "E", minPercent: 0, label: "Needs Support" },
];

@Injectable()
export class ExamsService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly auditService: AuditService,
    private readonly notificationFactory: NotificationFactory,
  ) {}

  // ── Grading scales ──────────────────────────────────────────────────────

  async listGradingScales(institutionId: string): Promise<GradingScaleDto[]> {
    const scaleRows = await this.database
      .select({
        id: gradingScales.id,
        institutionId: gradingScales.institutionId,
        name: gradingScales.name,
        isDefault: gradingScales.isDefault,
        status: gradingScales.status,
        createdAt: gradingScales.createdAt,
      })
      .from(gradingScales)
      .where(
        and(
          eq(gradingScales.institutionId, institutionId),
          ne(gradingScales.status, STATUS.GRADING_SCALE.DELETED),
        ),
      )
      .orderBy(desc(gradingScales.isDefault), asc(gradingScales.name));

    if (scaleRows.length === 0) return [];

    const bandRows = await this.database
      .select({
        id: gradingScaleBands.id,
        gradingScaleId: gradingScaleBands.gradingScaleId,
        grade: gradingScaleBands.grade,
        label: gradingScaleBands.label,
        minPercent: gradingScaleBands.minPercent,
        sortOrder: gradingScaleBands.sortOrder,
      })
      .from(gradingScaleBands)
      .where(
        inArray(
          gradingScaleBands.gradingScaleId,
          scaleRows.map((s) => s.id),
        ),
      )
      .orderBy(asc(gradingScaleBands.sortOrder));

    const bandsByScale = new Map<string, typeof bandRows>();
    for (const band of bandRows) {
      const list = bandsByScale.get(band.gradingScaleId) ?? [];
      list.push(band);
      bandsByScale.set(band.gradingScaleId, list);
    }

    return scaleRows.map((scale) => ({
      id: scale.id,
      institutionId: scale.institutionId,
      name: scale.name,
      isDefault: scale.isDefault,
      status: scale.status,
      bands: (bandsByScale.get(scale.id) ?? []).map((b) => ({
        id: b.id,
        grade: b.grade,
        label: b.label,
        minPercent: b.minPercent,
        sortOrder: b.sortOrder,
      })),
      createdAt: scale.createdAt.toISOString(),
    }));
  }

  async createGradingScale(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateGradingScaleDto,
  ): Promise<GradingScaleDto> {
    const scaleId = randomUUID();

    // Check if this is the first scale — make it default
    const existingScales = await this.database
      .select({ id: gradingScales.id })
      .from(gradingScales)
      .where(
        and(
          eq(gradingScales.institutionId, institutionId),
          ne(gradingScales.status, STATUS.GRADING_SCALE.DELETED),
        ),
      )
      .limit(1);

    const isFirstScale = existingScales.length === 0;

    await this.database.transaction(async (tx) => {
      await tx.insert(gradingScales).values({
        id: scaleId,
        institutionId,
        name: payload.name.trim(),
        isDefault: isFirstScale,
      });

      await tx.insert(gradingScaleBands).values(
        payload.bands.map((band) => ({
          id: randomUUID(),
          gradingScaleId: scaleId,
          grade: band.grade.trim(),
          label: band.label.trim(),
          minPercent: band.minPercent,
          sortOrder: band.sortOrder,
        })),
      );

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.EXAM_MARKS,
        entityId: scaleId,
        entityLabel: payload.name,
        summary: `Created grading scale "${payload.name}".`,
      });
    });

    const scales = await this.listGradingScales(institutionId);
    const created = scales.find((s) => s.id === scaleId);
    if (!created) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.GRADING_SCALE_NOT_FOUND);
    }
    return created;
  }

  async updateGradingScale(
    institutionId: string,
    scaleId: string,
    authSession: AuthenticatedSession,
    payload: UpdateGradingScaleDto,
  ): Promise<GradingScaleDto> {
    const scale = await this.getGradingScaleOrThrow(institutionId, scaleId);

    await this.database.transaction(async (tx) => {
      if (payload.name) {
        await tx
          .update(gradingScales)
          .set({ name: payload.name.trim() })
          .where(eq(gradingScales.id, scaleId));
      }

      if (payload.bands) {
        // Replace all bands
        await tx
          .delete(gradingScaleBands)
          .where(eq(gradingScaleBands.gradingScaleId, scaleId));

        await tx.insert(gradingScaleBands).values(
          payload.bands.map((band) => ({
            id: randomUUID(),
            gradingScaleId: scaleId,
            grade: band.grade.trim(),
            label: band.label.trim(),
            minPercent: band.minPercent,
            sortOrder: band.sortOrder,
          })),
        );
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.EXAM_MARKS,
        entityId: scaleId,
        entityLabel: payload.name ?? scale.name,
        summary: `Updated grading scale "${payload.name ?? scale.name}".`,
      });
    });

    const scales = await this.listGradingScales(institutionId);
    const updated = scales.find((s) => s.id === scaleId);
    if (!updated) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.GRADING_SCALE_NOT_FOUND);
    }
    return updated;
  }

  async setDefaultGradingScale(
    institutionId: string,
    scaleId: string,
    authSession: AuthenticatedSession,
  ): Promise<GradingScaleDto> {
    const scale = await this.getGradingScaleOrThrow(institutionId, scaleId);

    await this.database.transaction(async (tx) => {
      // Clear all defaults for institution
      await tx
        .update(gradingScales)
        .set({ isDefault: false })
        .where(eq(gradingScales.institutionId, institutionId));

      // Set this one as default
      await tx
        .update(gradingScales)
        .set({ isDefault: true })
        .where(eq(gradingScales.id, scaleId));

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.EXAM_MARKS,
        entityId: scaleId,
        entityLabel: scale.name,
        summary: `Set grading scale "${scale.name}" as default.`,
      });
    });

    const scales = await this.listGradingScales(institutionId);
    return scales.find((s) => s.id === scaleId)!;
  }

  // ── Exam terms ──────────────────────────────────────────────────────────

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
        examType: examTerms.examType,
        weightageInBp: examTerms.weightageInBp,
        gradingScaleId: examTerms.gradingScaleId,
        defaultPassingPercent: examTerms.defaultPassingPercent,
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

    // Validate gradingScaleId if provided
    if (payload.gradingScaleId) {
      await this.getGradingScaleOrThrow(institutionId, payload.gradingScaleId);
    }

    const examTermId = randomUUID();

    await this.database.insert(examTerms).values({
      id: examTermId,
      institutionId,
      academicYearId: academicYear.id,
      name: payload.name.trim(),
      examType: payload.examType,
      weightageInBp: payload.weightageInBp,
      gradingScaleId: payload.gradingScaleId ?? null,
      defaultPassingPercent: payload.defaultPassingPercent,
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

  // ── Marks ───────────────────────────────────────────────────────────────

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
        graceMarks: examMarks.graceMarks,
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
      graceMarks: row.graceMarks,
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
    const examTerm = await this.getExamTermWithYearOrThrow(
      institutionId,
      examTermId,
    );
    await this.assertStudentsBelongToInstitution(
      institutionId,
      payload.entries.map((entry) => entry.studentId),
    );

    const existingMarks = await this.database
      .select({ id: examMarks.id })
      .from(examMarks)
      .where(
        and(
          eq(examMarks.institutionId, institutionId),
          eq(examMarks.examTermId, examTermId),
        ),
      );
    const uniqueStudentCount = new Set(
      payload.entries.map((entry) => entry.studentId),
    ).size;

    await this.database.transaction(async (tx) => {
      await tx.delete(examMarks).where(eq(examMarks.examTermId, examTermId));

      if (payload.entries.length > 0) {
        await tx.insert(examMarks).values(
          payload.entries.map((entry) => ({
            id: randomUUID(),
            institutionId,
            examTermId,
            studentId: entry.studentId,
            subjectName: entry.subjectName.trim(),
            maxMarks: entry.maxMarks,
            obtainedMarks: entry.obtainedMarks,
            graceMarks: entry.graceMarks ?? 0,
            remarks: entry.remarks?.trim() || null,
          })),
        );
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.REPLACE,
        entityType: AUDIT_ENTITY_TYPES.EXAM_MARKS,
        entityId: examTermId,
        entityLabel: examTerm.name,
        summary: `Replaced marks for ${examTerm.name}.`,
        metadata: {
          academicYearId: examTerm.academicYearId,
          previousEntryCount: existingMarks.length,
          nextEntryCount: payload.entries.length,
          uniqueStudentCount,
        },
      });
    });

    this.notificationFactory
      .notify({
        institutionId,
        createdByUserId: authSession.user.id,
        type: NOTIFICATION_TYPES.EXAM_RESULTS_PUBLISHED,
        channel: NOTIFICATION_CHANNELS.ACADEMICS,
        tone: NOTIFICATION_TONES.INFO,
        audience: "all",
        title: "Exam results published",
        message: `Results for ${examTerm.name} have been published for ${uniqueStudentCount} student${uniqueStudentCount !== 1 ? "s" : ""}.`,
        senderLabel: authSession.user.name,
      })
      .catch(() => {});

    return this.listExamMarks(institutionId, examTermId, authSession);
  }

  // ── Report card ─────────────────────────────────────────────────────────

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
    const examTerm = await this.getExamTermFullOrThrow(
      institutionId,
      examTermId,
    );
    const bands = await this.resolveGradingBands(institutionId, examTerm);
    const passingPercent = examTerm.defaultPassingPercent;

    const [studentRow] = await this.database
      .select({
        id: students.id,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNumber: students.admissionNumber,
        classId: students.classId,
        sectionId: students.sectionId,
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
        graceMarks: examMarks.graceMarks,
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
      const effectiveMarks = row.obtainedMarks + row.graceMarks;
      const percent = this.roundPercent(
        this.toPercent(effectiveMarks, row.maxMarks),
      );
      return {
        subjectName: row.subjectName,
        maxMarks: row.maxMarks,
        obtainedMarks: row.obtainedMarks,
        graceMarks: row.graceMarks,
        effectiveMarks,
        percent,
        grade: this.resolveGrade(percent, bands),
        result: percent >= passingPercent ? "Pass" : "Fail",
        remarks: row.remarks,
      };
    });

    const totalMaxMarks = subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const totalObtainedMarks = subjects.reduce(
      (sum, s) => sum + s.obtainedMarks,
      0,
    );
    const totalEffectiveMarks = subjects.reduce(
      (sum, s) => sum + s.effectiveMarks,
      0,
    );
    const overallPercent = this.roundPercent(
      this.toPercent(totalEffectiveMarks, totalMaxMarks),
    );
    const allSubjectsPass = subjects.every((s) => s.result === "Pass");

    // Compute ranks
    const classRank = await this.computeStudentRank(
      institutionId,
      examTermId,
      query.studentId,
      studentRow.classId,
      undefined,
    );
    const sectionRank = studentRow.sectionId
      ? await this.computeStudentRank(
          institutionId,
          examTermId,
          query.studentId,
          studentRow.classId,
          studentRow.sectionId,
        )
      : null;

    return {
      examTermId: examTerm.id,
      examTermName: examTerm.name,
      examType: examTerm.examType,
      academicYearId: examTerm.academicYearId,
      academicYearName: examTerm.academicYearName,
      studentId: studentRow.id,
      studentFullName: [studentRow.firstName, studentRow.lastName]
        .filter(Boolean)
        .join(" "),
      admissionNumber: studentRow.admissionNumber,
      defaultPassingPercent: passingPercent,
      classRank,
      sectionRank,
      summary: {
        totalMaxMarks,
        totalObtainedMarks,
        totalEffectiveMarks,
        overallPercent,
        overallGrade: this.resolveGrade(overallPercent, bands),
        result:
          allSubjectsPass && overallPercent >= passingPercent ? "Pass" : "Fail",
      },
      subjects,
      gradingScheme: bands.map((b) => ({
        grade: b.grade,
        minPercent: b.minPercent,
        label: b.label,
      })),
    };
  }

  // ── Ranks ───────────────────────────────────────────────────────────────

  async getRanks(
    institutionId: string,
    examTermId: string,
    query: RanksQueryDto,
  ): Promise<RanksDto> {
    const examTerm = await this.getExamTermFullOrThrow(
      institutionId,
      examTermId,
    );
    const bands = await this.resolveGradingBands(institutionId, examTerm);
    const ranked = await this.computeRankedList(
      institutionId,
      examTermId,
      query.classId,
      query.sectionId,
      bands,
    );

    return {
      examTermId: examTerm.id,
      examTermName: examTerm.name,
      students: ranked,
    };
  }

  // ── Class analysis ──────────────────────────────────────────────────────

  async getClassAnalysis(
    institutionId: string,
    examTermId: string,
    query: ClassAnalysisQueryDto,
  ): Promise<ClassAnalysisDto> {
    const examTerm = await this.getExamTermFullOrThrow(
      institutionId,
      examTermId,
    );
    const passingPercent = examTerm.defaultPassingPercent;

    // Get all marks for students in this class/section
    const conditions = [
      eq(examMarks.institutionId, institutionId),
      eq(examMarks.examTermId, examTermId),
      eq(students.classId, query.classId),
    ];
    if (query.sectionId) {
      conditions.push(eq(students.sectionId, query.sectionId));
    }

    const markRows = await this.database
      .select({
        studentId: examMarks.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        subjectName: examMarks.subjectName,
        maxMarks: examMarks.maxMarks,
        obtainedMarks: examMarks.obtainedMarks,
        graceMarks: examMarks.graceMarks,
      })
      .from(examMarks)
      .innerJoin(students, eq(examMarks.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(and(...conditions, ne(member.status, STATUS.MEMBER.DELETED)));

    // Group by subject
    type SubjectStats = {
      total: number;
      count: number;
      highest: number;
      lowest: number;
      passCount: number;
      failCount: number;
      topperName: string;
      topperMarks: number;
    };
    const subjectMap = new Map<string, SubjectStats>();

    for (const row of markRows) {
      const effective = row.obtainedMarks + row.graceMarks;
      const percent = row.maxMarks > 0 ? (effective / row.maxMarks) * 100 : 0;
      const name = [row.studentFirstName, row.studentLastName]
        .filter(Boolean)
        .join(" ");

      let stats = subjectMap.get(row.subjectName);
      if (!stats) {
        stats = {
          total: 0,
          count: 0,
          highest: 0,
          lowest: Infinity,
          passCount: 0,
          failCount: 0,
          topperName: "",
          topperMarks: -1,
        };
        subjectMap.set(row.subjectName, stats);
      }

      stats.total += effective;
      stats.count++;
      if (effective > stats.highest) stats.highest = effective;
      if (effective < stats.lowest) stats.lowest = effective;
      if (percent >= passingPercent) stats.passCount++;
      else stats.failCount++;
      if (effective > stats.topperMarks) {
        stats.topperMarks = effective;
        stats.topperName = name;
      }
    }

    const subjects = Array.from(subjectMap.entries()).map(
      ([subjectName, stats]) => ({
        subjectName,
        average:
          stats.count > 0 ? Number((stats.total / stats.count).toFixed(2)) : 0,
        highest: stats.highest,
        lowest: stats.lowest === Infinity ? 0 : stats.lowest,
        passCount: stats.passCount,
        failCount: stats.failCount,
        topperName: stats.topperName,
      }),
    );

    // Per-student totals for class-level stats
    const studentTotals = new Map<
      string,
      { name: string; totalEffective: number; totalMax: number }
    >();
    for (const row of markRows) {
      const key = row.studentId;
      const existing = studentTotals.get(key) ?? {
        name: [row.studentFirstName, row.studentLastName]
          .filter(Boolean)
          .join(" "),
        totalEffective: 0,
        totalMax: 0,
      };
      existing.totalEffective += row.obtainedMarks + row.graceMarks;
      existing.totalMax += row.maxMarks;
      studentTotals.set(key, existing);
    }

    let classTopperName = "";
    let classTopperPercent = 0;
    let totalClassPercent = 0;
    let overallPassCount = 0;
    let overallFailCount = 0;

    for (const s of studentTotals.values()) {
      const pct = s.totalMax > 0 ? (s.totalEffective / s.totalMax) * 100 : 0;
      totalClassPercent += pct;
      if (pct >= passingPercent) overallPassCount++;
      else overallFailCount++;
      if (pct > classTopperPercent) {
        classTopperPercent = pct;
        classTopperName = s.name;
      }
    }

    const studentCount = studentTotals.size;
    const classAverage =
      studentCount > 0
        ? Number((totalClassPercent / studentCount).toFixed(2))
        : 0;

    return {
      examTermId: examTerm.id,
      examTermName: examTerm.name,
      classAverage,
      classTopperName,
      classTopperPercent: Number(classTopperPercent.toFixed(2)),
      studentCount,
      passCount: overallPassCount,
      failCount: overallFailCount,
      subjects,
    };
  }

  // ── Batch report cards ──────────────────────────────────────────────────

  async getBatchReportCards(
    institutionId: string,
    examTermId: string,
    query: BatchReportCardsQueryDto,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ): Promise<ExamReportCardDto[]> {
    // Get students in class/section
    const conditions = [
      eq(students.institutionId, institutionId),
      eq(students.classId, query.classId),
      ne(member.status, STATUS.MEMBER.DELETED),
    ];
    if (query.sectionId) {
      conditions.push(eq(students.sectionId, query.sectionId));
    }

    const studentRows = await this.database
      .select({ id: students.id })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(and(...conditions))
      .orderBy(asc(students.firstName), asc(students.lastName));

    const reportCards: ExamReportCardDto[] = [];
    for (const student of studentRows) {
      try {
        const card = await this.getExamReportCard(
          institutionId,
          examTermId,
          { studentId: student.id },
          scopes,
        );
        reportCards.push(card);
      } catch {
        // Skip students with no marks
      }
    }

    return reportCards;
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  private async resolveGradingBands(
    institutionId: string,
    examTerm: { gradingScaleId: string | null },
  ): Promise<GradeBand[]> {
    let scaleId = examTerm.gradingScaleId;

    if (!scaleId) {
      // Use institution default
      const [defaultScale] = await this.database
        .select({ id: gradingScales.id })
        .from(gradingScales)
        .where(
          and(
            eq(gradingScales.institutionId, institutionId),
            eq(gradingScales.isDefault, true),
            ne(gradingScales.status, STATUS.GRADING_SCALE.DELETED),
          ),
        )
        .limit(1);

      if (!defaultScale) {
        return FALLBACK_GRADING_SCHEME;
      }
      scaleId = defaultScale.id;
    }

    const bandRows = await this.database
      .select({
        grade: gradingScaleBands.grade,
        label: gradingScaleBands.label,
        minPercent: gradingScaleBands.minPercent,
      })
      .from(gradingScaleBands)
      .where(eq(gradingScaleBands.gradingScaleId, scaleId))
      .orderBy(desc(gradingScaleBands.minPercent));

    if (bandRows.length === 0) {
      return FALLBACK_GRADING_SCHEME;
    }

    return bandRows;
  }

  private async computeStudentRank(
    institutionId: string,
    examTermId: string,
    studentId: string,
    classId: string,
    sectionId: string | undefined,
  ): Promise<number | null> {
    const conditions = [
      eq(examMarks.institutionId, institutionId),
      eq(examMarks.examTermId, examTermId),
      eq(students.classId, classId),
      ne(member.status, STATUS.MEMBER.DELETED),
    ];
    if (sectionId) {
      conditions.push(eq(students.sectionId, sectionId));
    }

    const markRows = await this.database
      .select({
        studentId: examMarks.studentId,
        obtainedMarks: examMarks.obtainedMarks,
        graceMarks: examMarks.graceMarks,
      })
      .from(examMarks)
      .innerJoin(students, eq(examMarks.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(and(...conditions));

    // Sum per student
    const totals = new Map<string, number>();
    for (const row of markRows) {
      totals.set(
        row.studentId,
        (totals.get(row.studentId) ?? 0) + row.obtainedMarks + row.graceMarks,
      );
    }

    if (!totals.has(studentId)) return null;

    // Sort descending and assign dense rank
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    let rank = 0;
    let prevTotal = -1;
    for (const [sid, total] of sorted) {
      if (total !== prevTotal) {
        rank++;
        prevTotal = total;
      }
      if (sid === studentId) return rank;
    }

    return null;
  }

  private async computeRankedList(
    institutionId: string,
    examTermId: string,
    classId: string,
    sectionId: string | undefined,
    bands: GradeBand[],
  ) {
    const conditions = [
      eq(examMarks.institutionId, institutionId),
      eq(examMarks.examTermId, examTermId),
      eq(students.classId, classId),
      ne(member.status, STATUS.MEMBER.DELETED),
    ];
    if (sectionId) {
      conditions.push(eq(students.sectionId, sectionId));
    }

    const markRows = await this.database
      .select({
        studentId: examMarks.studentId,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        admissionNumber: students.admissionNumber,
        maxMarks: examMarks.maxMarks,
        obtainedMarks: examMarks.obtainedMarks,
        graceMarks: examMarks.graceMarks,
      })
      .from(examMarks)
      .innerJoin(students, eq(examMarks.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(and(...conditions));

    const studentMap = new Map<
      string,
      {
        name: string;
        admissionNumber: string;
        totalEffective: number;
        totalMax: number;
      }
    >();

    for (const row of markRows) {
      const existing = studentMap.get(row.studentId) ?? {
        name: [row.studentFirstName, row.studentLastName]
          .filter(Boolean)
          .join(" "),
        admissionNumber: row.admissionNumber,
        totalEffective: 0,
        totalMax: 0,
      };
      existing.totalEffective += row.obtainedMarks + row.graceMarks;
      existing.totalMax += row.maxMarks;
      studentMap.set(row.studentId, existing);
    }

    const list = Array.from(studentMap.entries())
      .map(([studentId, data]) => ({
        studentId,
        studentFullName: data.name,
        admissionNumber: data.admissionNumber,
        totalEffectiveMarks: data.totalEffective,
        totalMaxMarks: data.totalMax,
        percentage: this.roundPercent(
          this.toPercent(data.totalEffective, data.totalMax),
        ),
      }))
      .sort((a, b) => b.totalEffectiveMarks - a.totalEffectiveMarks);

    // Dense ranking
    let rank = 0;
    let prevTotal = -1;
    return list.map((item) => {
      if (item.totalEffectiveMarks !== prevTotal) {
        rank++;
        prevTotal = item.totalEffectiveMarks;
      }
      return {
        ...item,
        grade: this.resolveGrade(item.percentage, bands),
        rank,
      };
    });
  }

  private async getGradingScaleOrThrow(institutionId: string, scaleId: string) {
    const [scale] = await this.database
      .select({
        id: gradingScales.id,
        name: gradingScales.name,
      })
      .from(gradingScales)
      .where(
        and(
          eq(gradingScales.id, scaleId),
          eq(gradingScales.institutionId, institutionId),
          ne(gradingScales.status, STATUS.GRADING_SCALE.DELETED),
        ),
      )
      .limit(1);

    if (!scale) {
      throw new NotFoundException(ERROR_MESSAGES.EXAMS.GRADING_SCALE_NOT_FOUND);
    }

    return scale;
  }

  private async getAcademicYearOrThrow(
    institutionId: string,
    academicYearId: string,
  ) {
    const [academicYear] = await this.database
      .select({ id: academicYears.id })
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
      .select({ id: examTerms.id })
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

  private async getExamTermFullOrThrow(
    institutionId: string,
    examTermId: string,
  ) {
    const [examTerm] = await this.database
      .select({
        id: examTerms.id,
        academicYearId: examTerms.academicYearId,
        academicYearName: academicYears.name,
        name: examTerms.name,
        examType: examTerms.examType,
        weightageInBp: examTerms.weightageInBp,
        gradingScaleId: examTerms.gradingScaleId,
        defaultPassingPercent: examTerms.defaultPassingPercent,
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
    if (studentIds.length === 0) return;

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

  private toPercent(obtained: number, max: number) {
    if (max <= 0) return 0;
    return (obtained / max) * 100;
  }

  private roundPercent(value: number) {
    return Number(value.toFixed(2));
  }

  private resolveGrade(percent: number, bands: GradeBand[]) {
    const matched = bands.find((b) => percent >= b.minPercent);
    return matched?.grade ?? bands[bands.length - 1]?.grade ?? "E";
  }
}
