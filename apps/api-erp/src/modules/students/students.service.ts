import { DATABASE } from "@repo/backend-core";
import {
  ADMISSION_FORM_FIELD_SCOPES,
  ATTENDANCE_STATUSES,
} from "@repo/contracts";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  attendanceRecords,
  campus,
  campusMemberships,
  classSections,
  count,
  desc,
  eq,
  examMarks,
  examTerms,
  feeAssignmentAdjustments,
  feeAssignments,
  feePaymentReversals,
  feePayments,
  feeStructureInstallments,
  feeStructures,
  gte,
  ilike,
  inArray,
  isNull,
  member,
  ne,
  or,
  schoolClasses,
  studentCurrentEnrollments,
  studentGuardianLinks,
  students,
  sql,
  type SQL,
  user,
} from "@repo/database";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  GUARDIAN_RELATIONSHIPS,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
} from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter, sectionScopeFilter } from "../auth/scope-filter";
import { AdmissionFormFieldsService } from "../admissions/admission-form-fields.service";
import type {
  CreateGuardianLinkDto,
  CurrentEnrollmentDto,
  CreateStudentDto,
  ListStudentsQueryDto,
  UpdateStudentDto,
} from "./students.schemas";
import { sortableStudentColumns } from "./students.schemas";

type StudentGuardianSummary = {
  membershipId: string;
  userId: string | null;
  name: string;
  mobile: string;
  email: string | null;
  relationship: (typeof GUARDIAN_RELATIONSHIPS)[keyof typeof GUARDIAN_RELATIONSHIPS];
  isPrimary: boolean;
};

type StudentCurrentEnrollmentSummary = {
  academicYearId: string;
  academicYearName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
};

type ResolvedClassSection = {
  classId: string;
  className: string;
  classCampusId: string;
  sectionId: string;
  sectionName: string;
};

type StudentsWriter = Pick<AppDatabase, "insert" | "select" | "update">;

type StudentAttendanceSummary = {
  absent: number;
  absentStreak: number;
  attendancePercent: number;
  endDate: string;
  excused: number;
  late: number;
  present: number;
  recentRecords: Array<{
    date: string;
    status: string;
  }>;
  startDate: string;
  totalMarkedDays: number;
};

type StudentFeesSummary = {
  assignmentCount: number;
  nextDueDate: string | null;
  overdueCount: number;
  paymentCount: number;
  recentAssignments: Array<{
    adjustedAmountInPaise: number;
    assignedAmountInPaise: number;
    dueDate: string;
    feeStructureId: string;
    feeStructureName: string;
    id: string;
    installmentId: string | null;
    installmentLabel: string | null;
    outstandingAmountInPaise: number;
    paidAmountInPaise: number;
    status: string;
  }>;
  recentPayments: Array<{
    amountInPaise: number;
    createdAt: string;
    feeAssignmentId: string;
    id: string;
    paymentDate: string;
    paymentMethod: string;
  }>;
  totalAdjustedInPaise: number;
  totalAssignedInPaise: number;
  totalOutstandingInPaise: number;
  totalPaidInPaise: number;
};

type StudentExamTermSummary = {
  academicYearId: string;
  academicYearName: string;
  endDate: string;
  examTermId: string;
  examTermName: string;
  overallGrade: string;
  overallPercent: number;
  subjectCount: number;
  totalMaxMarks: number;
  totalObtainedMarks: number;
};

type StudentExamsSummary = {
  latestTerm: StudentExamTermSummary | null;
  recentTerms: StudentExamTermSummary[];
};

type StudentTimelineEvent = {
  description: string;
  occurredAt: string;
  title: string;
  type: string;
};

const sortableColumns = {
  admissionNumber: students.admissionNumber,
  campus: campus.name,
  name: students.firstName,
} as const;

const ATTENDANCE_RECENT_WINDOW_DAYS = 30;
const STUDENT_ATTENDANCE_RECENT_RECORD_LIMIT = 7;
const STUDENT_FEE_RECENT_ASSIGNMENT_LIMIT = 5;
const STUDENT_FEE_RECENT_PAYMENT_LIMIT = 5;
const STUDENT_EXAM_RECENT_TERM_LIMIT = 5;
const STUDENT_TIMELINE_LIMIT = 10;

const STUDENT_TIMELINE_EVENT_TYPES = {
  ATTENDANCE: "attendance",
  EXAM: "exam",
  FEE_PAYMENT: "fee_payment",
  GUARDIAN: "guardian",
  PROFILE: "profile",
} as const;

const EXAM_GRADING_SCHEME = [
  { grade: "A1", minPercent: 90 },
  { grade: "A2", minPercent: 80 },
  { grade: "B1", minPercent: 70 },
  { grade: "B2", minPercent: 60 },
  { grade: "C1", minPercent: 50 },
  { grade: "C2", minPercent: 40 },
  { grade: "D", minPercent: 33 },
  { grade: "E", minPercent: 0 },
] as const;

@Injectable()
export class StudentsService {
  private readonly studentSelect = {
    id: students.id,
    membershipId: students.membershipId,
    institutionId: students.institutionId,
    admissionNumber: students.admissionNumber,
    firstName: students.firstName,
    lastName: students.lastName,
    classId: students.classId,
    className: schoolClasses.name,
    sectionId: students.sectionId,
    sectionName: classSections.name,
    campusId: campus.id,
    campusName: campus.name,
    status: member.status,
    customFieldValues: students.customFieldValues,
  };

  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly admissionFormFieldsService: AdmissionFormFieldsService,
  ) {}

  async listStudents(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListStudentsQueryDto = {},
  ): Promise<PaginatedResult<Awaited<ReturnType<typeof this.getStudent>>>> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    await this.getCampus(institutionId, activeCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableStudentColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(students.institutionId, institutionId),
      ne(member.status, STATUS.MEMBER.DELETED),
      ne(campus.status, STATUS.CAMPUS.DELETED),
      ne(schoolClasses.status, STATUS.CLASS.DELETED),
      eq(classSections.status, STATUS.SECTION.ACTIVE),
    ];

    conditions.push(eq(member.primaryCampusId, activeCampusId));

    const sectionFilter = sectionScopeFilter(
      students.sectionId,
      activeCampusScopes,
    );
    if (sectionFilter) conditions.push(sectionFilter);

    if (query.search) {
      conditions.push(
        or(
          ilike(students.admissionNumber, `%${query.search}%`),
          ilike(students.firstName, `%${query.search}%`),
          ilike(students.lastName, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const studentRows = await this.db
      .select(this.studentSelect)
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        asc(students.firstName),
        asc(students.lastName),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    const guardiansByStudent = await this.listGuardiansForStudentMemberships(
      studentRows.map((row) => row.membershipId),
    );
    const currentEnrollmentByStudent =
      await this.listCurrentEnrollmentForStudentMemberships(
        institutionId,
        studentRows.map((row) => row.membershipId),
      );

    return {
      rows: studentRows.map((row) => ({
        ...row,
        fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
        guardians: guardiansByStudent.get(row.membershipId) ?? [],
        currentEnrollment:
          currentEnrollmentByStudent.get(row.membershipId) ?? null,
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getStudent(
    institutionId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const [studentRecord] = await this.listStudentsForInstitution(
      institutionId,
      activeCampusScopes,
      studentId,
    );

    if (!studentRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return studentRecord;
  }

  async getStudentSummary(
    institutionId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ) {
    const student = await this.getStudent(
      institutionId,
      studentId,
      authSession,
      scopes,
    );

    const [attendance, fees, exams, timeline] = await Promise.all([
      this.getStudentAttendanceSummary(institutionId, studentId),
      this.getStudentFeesSummary(institutionId, studentId),
      this.getStudentExamsSummary(institutionId, studentId),
      this.getStudentTimeline(institutionId, studentId, student.membershipId),
    ]);

    return {
      student,
      attendance,
      fees,
      exams,
      timeline,
    };
  }

  async listStudentOptions(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
  ) {
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const studentRows = await this.listStudentsForInstitution(
      institutionId,
      activeCampusScopes,
    );

    return studentRows.map((student) => ({
      id: student.id,
      admissionNumber: student.admissionNumber,
      fullName: student.fullName,
      campusName: student.campusName,
    }));
  }

  async updateStudent(
    institutionId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
    payload: UpdateStudentDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const existingStudent = await this.getStudentMembership(
      institutionId,
      studentId,
      activeCampusId,
    );
    const selectedCampus = await this.getCampus(institutionId, activeCampusId);
    const nextCurrentEnrollment = payload.currentEnrollment ?? null;

    if (nextCurrentEnrollment) {
      await this.getAcademicYear(
        institutionId,
        nextCurrentEnrollment.academicYearId,
      );
    }

    const studentPlacement = await this.getResolvedClassSection(
      institutionId,
      payload.classId,
      payload.sectionId,
    );
    this.assertClassMatchesCampus(studentPlacement, selectedCampus.id);

    const resolvedCurrentEnrollment = nextCurrentEnrollment
      ? await this.getResolvedClassSection(
          institutionId,
          nextCurrentEnrollment.classId,
          nextCurrentEnrollment.sectionId,
        )
      : null;

    if (resolvedCurrentEnrollment) {
      this.assertClassMatchesCampus(
        resolvedCurrentEnrollment,
        selectedCampus.id,
      );
    }

    await this.assertAdmissionNumberAvailable(
      institutionId,
      payload.admissionNumber.trim(),
      studentId,
    );

    const customFieldValues =
      await this.admissionFormFieldsService.validateValues(
        institutionId,
        ADMISSION_FORM_FIELD_SCOPES.STUDENT,
        payload.customFieldValues ?? undefined,
      );

    await this.db.transaction(async (tx) => {
      await tx
        .update(member)
        .set({
          primaryCampusId: selectedCampus.id,
        })
        .where(eq(member.id, existingStudent.membershipId));

      await this.ensureCampusMembership(
        tx,
        existingStudent.membershipId,
        selectedCampus.id,
      );

      await tx
        .update(students)
        .set({
          admissionNumber: payload.admissionNumber.trim(),
          firstName: payload.firstName.trim(),
          lastName: payload.lastName?.trim() || null,
          classId: studentPlacement.classId,
          sectionId: studentPlacement.sectionId,
          customFieldValues,
        })
        .where(eq(students.id, studentId));

      const activeGuardianLinks = await tx
        .select({
          linkId: studentGuardianLinks.id,
          parentMembershipId: studentGuardianLinks.parentMembershipId,
        })
        .from(studentGuardianLinks)
        .where(
          and(
            eq(
              studentGuardianLinks.studentMembershipId,
              existingStudent.membershipId,
            ),
            isNull(studentGuardianLinks.deletedAt),
          ),
        );

      const nextGuardianMembershipIds = new Set<string>();

      for (const guardianPayload of payload.guardians) {
        const guardianMembershipId = await this.getOrCreateGuardianMembership(
          tx,
          institutionId,
          selectedCampus.id,
          guardianPayload,
        );

        nextGuardianMembershipIds.add(guardianMembershipId);

        const existingLink = activeGuardianLinks.find(
          (link) => link.parentMembershipId === guardianMembershipId,
        );

        if (existingLink) {
          await tx
            .update(studentGuardianLinks)
            .set({
              relationship: guardianPayload.relationship,
              isPrimary: guardianPayload.isPrimary,
              deletedAt: null,
            })
            .where(eq(studentGuardianLinks.id, existingLink.linkId));
          continue;
        }

        await tx.insert(studentGuardianLinks).values({
          id: randomUUID(),
          studentMembershipId: existingStudent.membershipId,
          parentMembershipId: guardianMembershipId,
          relationship: guardianPayload.relationship,
          isPrimary: guardianPayload.isPrimary,
          acceptedAt: null,
          deletedAt: null,
        });
      }

      const removedLinkIds = activeGuardianLinks
        .filter(
          (link) => !nextGuardianMembershipIds.has(link.parentMembershipId),
        )
        .map((link) => link.linkId);

      if (removedLinkIds.length > 0) {
        await tx
          .update(studentGuardianLinks)
          .set({
            deletedAt: new Date(),
          })
          .where(inArray(studentGuardianLinks.id, removedLinkIds));
      }

      await this.syncCurrentEnrollment(
        tx,
        institutionId,
        existingStudent.membershipId,
        nextCurrentEnrollment,
        resolvedCurrentEnrollment,
      );
    });

    return this.getStudent(
      institutionId,
      studentId,
      authSession,
      activeCampusScopes,
    );
  }

  private async listStudentsForInstitution(
    institutionId: string,
    scopes: ResolvedScopes,
    studentId?: string,
  ) {
    const studentRows = await this.db
      .select(this.studentSelect)
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          studentId ? eq(students.id, studentId) : undefined,
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(campus.status, STATUS.CAMPUS.DELETED),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
          campusScopeFilter(member.primaryCampusId, scopes),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      );

    const guardiansByStudent = await this.listGuardiansForStudentMemberships(
      studentRows.map((row) => row.membershipId),
    );
    const currentEnrollmentByStudent =
      await this.listCurrentEnrollmentForStudentMemberships(
        institutionId,
        studentRows.map((row) => row.membershipId),
      );

    return studentRows.map((row) => ({
      ...row,
      fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
      guardians: guardiansByStudent.get(row.membershipId) ?? [],
      currentEnrollment:
        currentEnrollmentByStudent.get(row.membershipId) ?? null,
    }));
  }

  private async getStudentAttendanceSummary(
    institutionId: string,
    studentId: string,
  ): Promise<StudentAttendanceSummary> {
    const endDate = this.getCurrentDateString();
    const startDate = this.getDateDaysAgoString(
      ATTENDANCE_RECENT_WINDOW_DAYS - 1,
    );
    const rows = await this.db
      .select({
        attendanceDate: attendanceRecords.attendanceDate,
        status: attendanceRecords.status,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.institutionId, institutionId),
          eq(attendanceRecords.studentId, studentId),
          gte(attendanceRecords.attendanceDate, startDate),
        ),
      )
      .orderBy(desc(attendanceRecords.attendanceDate));

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const row of rows) {
      if (row.status === ATTENDANCE_STATUSES.PRESENT) present += 1;
      else if (row.status === ATTENDANCE_STATUSES.ABSENT) absent += 1;
      else if (row.status === ATTENDANCE_STATUSES.LATE) late += 1;
      else if (row.status === ATTENDANCE_STATUSES.EXCUSED) excused += 1;
    }

    let absentStreak = 0;
    for (const row of rows) {
      if (row.status !== ATTENDANCE_STATUSES.ABSENT) {
        break;
      }

      absentStreak += 1;
    }

    const totalMarkedDays = present + absent + late + excused;

    return {
      startDate,
      endDate,
      totalMarkedDays,
      present,
      absent,
      late,
      excused,
      attendancePercent:
        totalMarkedDays === 0
          ? 0
          : Math.round((present / totalMarkedDays) * 100),
      absentStreak,
      recentRecords: rows
        .slice(0, STUDENT_ATTENDANCE_RECENT_RECORD_LIMIT)
        .map((row) => ({
          date: row.attendanceDate,
          status: row.status,
        })),
    };
  }

  private async getStudentFeesSummary(
    institutionId: string,
    studentId: string,
  ): Promise<StudentFeesSummary> {
    const assignmentRows = await this.db
      .select({
        id: feeAssignments.id,
        feeStructureId: feeAssignments.feeStructureId,
        feeStructureName: feeStructures.name,
        installmentId: feeAssignments.installmentId,
        installmentLabel: feeStructureInstallments.label,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
        status: feeAssignments.status,
        createdAt: feeAssignments.createdAt,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .leftJoin(
        feeStructureInstallments,
        eq(feeAssignments.installmentId, feeStructureInstallments.id),
      )
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          eq(feeAssignments.studentId, studentId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
        ),
      )
      .orderBy(asc(feeAssignments.dueDate), desc(feeAssignments.createdAt));

    const assignmentIds = assignmentRows.map((row) => row.id);
    const [paymentSummaryRows, adjustmentSummaryRows, recentPaymentRows] =
      assignmentIds.length === 0
        ? [[], [], []]
        : await Promise.all([
            this.db
              .select({
                feeAssignmentId: feePayments.feeAssignmentId,
                totalPaidAmountInPaise: sql<number>`coalesce(sum(${feePayments.amountInPaise}), 0)`,
                paymentCount: sql<number>`count(${feePayments.id})`,
              })
              .from(feePayments)
              .leftJoin(
                feePaymentReversals,
                eq(feePaymentReversals.feePaymentId, feePayments.id),
              )
              .where(
                and(
                  inArray(feePayments.feeAssignmentId, assignmentIds),
                  isNull(feePayments.deletedAt),
                  isNull(feePaymentReversals.id),
                ),
              )
              .groupBy(feePayments.feeAssignmentId),
            this.db
              .select({
                feeAssignmentId: feeAssignmentAdjustments.feeAssignmentId,
                totalAdjustmentAmountInPaise: sql<number>`coalesce(sum(${feeAssignmentAdjustments.amountInPaise}), 0)`,
              })
              .from(feeAssignmentAdjustments)
              .where(
                inArray(
                  feeAssignmentAdjustments.feeAssignmentId,
                  assignmentIds,
                ),
              )
              .groupBy(feeAssignmentAdjustments.feeAssignmentId),
            this.db
              .select({
                id: feePayments.id,
                feeAssignmentId: feePayments.feeAssignmentId,
                amountInPaise: feePayments.amountInPaise,
                paymentDate: feePayments.paymentDate,
                paymentMethod: feePayments.paymentMethod,
                createdAt: feePayments.createdAt,
              })
              .from(feePayments)
              .innerJoin(
                feeAssignments,
                eq(feePayments.feeAssignmentId, feeAssignments.id),
              )
              .leftJoin(
                feePaymentReversals,
                eq(feePaymentReversals.feePaymentId, feePayments.id),
              )
              .where(
                and(
                  eq(feeAssignments.institutionId, institutionId),
                  eq(feeAssignments.studentId, studentId),
                  isNull(feePayments.deletedAt),
                  isNull(feePaymentReversals.id),
                ),
              )
              .orderBy(
                desc(feePayments.paymentDate),
                desc(feePayments.createdAt),
              )
              .limit(STUDENT_FEE_RECENT_PAYMENT_LIMIT),
          ]);

    const paymentSummaryByAssignment = new Map(
      paymentSummaryRows.map((row) => [
        row.feeAssignmentId,
        {
          totalPaidAmountInPaise: Number(row.totalPaidAmountInPaise),
          paymentCount: Number(row.paymentCount),
        },
      ]),
    );
    const adjustmentSummaryByAssignment = new Map(
      adjustmentSummaryRows.map((row) => [
        row.feeAssignmentId,
        Number(row.totalAdjustmentAmountInPaise),
      ]),
    );

    const assignmentSummaries = assignmentRows.map((row) => {
      const paymentSummary = paymentSummaryByAssignment.get(row.id) ?? {
        totalPaidAmountInPaise: 0,
        paymentCount: 0,
      };
      const adjustedAmountInPaise =
        adjustmentSummaryByAssignment.get(row.id) ?? 0;
      const outstandingAmountInPaise =
        row.assignedAmountInPaise -
        paymentSummary.totalPaidAmountInPaise -
        adjustedAmountInPaise;

      return {
        id: row.id,
        feeStructureId: row.feeStructureId,
        feeStructureName: row.feeStructureName,
        installmentId: row.installmentId,
        installmentLabel: row.installmentLabel ?? null,
        dueDate: row.dueDate,
        assignedAmountInPaise: row.assignedAmountInPaise,
        paidAmountInPaise: paymentSummary.totalPaidAmountInPaise,
        adjustedAmountInPaise,
        outstandingAmountInPaise,
        status: row.status,
        createdAt: row.createdAt,
        paymentCount: paymentSummary.paymentCount,
      };
    });

    const totalAssignedInPaise = assignmentSummaries.reduce(
      (sum, row) => sum + row.assignedAmountInPaise,
      0,
    );
    const totalPaidInPaise = assignmentSummaries.reduce(
      (sum, row) => sum + row.paidAmountInPaise,
      0,
    );
    const totalAdjustedInPaise = assignmentSummaries.reduce(
      (sum, row) => sum + row.adjustedAmountInPaise,
      0,
    );
    const totalOutstandingInPaise = assignmentSummaries.reduce(
      (sum, row) => sum + row.outstandingAmountInPaise,
      0,
    );
    const paymentCount = assignmentSummaries.reduce(
      (sum, row) => sum + row.paymentCount,
      0,
    );
    const openAssignments = assignmentSummaries
      .filter((row) => row.outstandingAmountInPaise > 0)
      .sort((left, right) => left.dueDate.localeCompare(right.dueDate));
    const today = this.getCurrentDateString();

    return {
      assignmentCount: assignmentSummaries.length,
      paymentCount,
      overdueCount: openAssignments.filter((row) => row.dueDate < today).length,
      totalAssignedInPaise,
      totalPaidInPaise,
      totalAdjustedInPaise,
      totalOutstandingInPaise,
      nextDueDate: openAssignments[0]?.dueDate ?? null,
      recentAssignments: (openAssignments.length > 0
        ? openAssignments
        : [...assignmentSummaries].sort((left, right) =>
            right.dueDate.localeCompare(left.dueDate),
          )
      )
        .slice(0, STUDENT_FEE_RECENT_ASSIGNMENT_LIMIT)
        .map(
          ({ createdAt: _createdAt, paymentCount: _paymentCount, ...row }) =>
            row,
        ),
      recentPayments: recentPaymentRows.map((row) => ({
        id: row.id,
        feeAssignmentId: row.feeAssignmentId,
        amountInPaise: row.amountInPaise,
        paymentDate: row.paymentDate,
        paymentMethod: row.paymentMethod,
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  private async getStudentExamsSummary(
    institutionId: string,
    studentId: string,
  ): Promise<StudentExamsSummary> {
    const rows = await this.db
      .select({
        examTermId: examTerms.id,
        examTermName: examTerms.name,
        academicYearId: examTerms.academicYearId,
        academicYearName: academicYears.name,
        endDate: examTerms.endDate,
        maxMarks: examMarks.maxMarks,
        obtainedMarks: examMarks.obtainedMarks,
      })
      .from(examMarks)
      .innerJoin(examTerms, eq(examMarks.examTermId, examTerms.id))
      .innerJoin(academicYears, eq(examTerms.academicYearId, academicYears.id))
      .where(
        and(
          eq(examMarks.institutionId, institutionId),
          eq(examMarks.studentId, studentId),
          eq(examTerms.institutionId, institutionId),
          isNull(examTerms.deletedAt),
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
        ),
      )
      .orderBy(desc(examTerms.endDate), asc(examTerms.name));

    const grouped = new Map<
      string,
      Omit<StudentExamTermSummary, "overallGrade" | "overallPercent">
    >();

    for (const row of rows) {
      const current = grouped.get(row.examTermId) ?? {
        examTermId: row.examTermId,
        examTermName: row.examTermName,
        academicYearId: row.academicYearId,
        academicYearName: row.academicYearName,
        endDate: row.endDate,
        subjectCount: 0,
        totalMaxMarks: 0,
        totalObtainedMarks: 0,
      };

      current.subjectCount += 1;
      current.totalMaxMarks += row.maxMarks;
      current.totalObtainedMarks += row.obtainedMarks;
      grouped.set(row.examTermId, current);
    }

    const recentTerms = Array.from(grouped.values())
      .map((row) => {
        const overallPercent = this.toRoundedPercent(
          row.totalObtainedMarks,
          row.totalMaxMarks,
        );

        return {
          ...row,
          overallPercent,
          overallGrade: this.resolveExamGrade(overallPercent),
        };
      })
      .sort((left, right) => right.endDate.localeCompare(left.endDate))
      .slice(0, STUDENT_EXAM_RECENT_TERM_LIMIT);

    return {
      latestTerm: recentTerms[0] ?? null,
      recentTerms,
    };
  }

  private async getStudentTimeline(
    institutionId: string,
    studentId: string,
    studentMembershipId: string,
  ): Promise<StudentTimelineEvent[]> {
    const [[studentRow], guardianRows, attendanceRows, paymentRows, examRows] =
      await Promise.all([
        this.db
          .select({
            createdAt: students.createdAt,
          })
          .from(students)
          .where(
            and(
              eq(students.id, studentId),
              eq(students.institutionId, institutionId),
            ),
          )
          .limit(1),
        this.db
          .select({
            invitedAt: studentGuardianLinks.invitedAt,
            name: user.name,
            relationship: studentGuardianLinks.relationship,
          })
          .from(studentGuardianLinks)
          .innerJoin(
            member,
            eq(studentGuardianLinks.parentMembershipId, member.id),
          )
          .innerJoin(user, eq(member.userId, user.id))
          .where(
            and(
              eq(studentGuardianLinks.studentMembershipId, studentMembershipId),
              isNull(studentGuardianLinks.deletedAt),
              ne(member.status, STATUS.MEMBER.DELETED),
            ),
          )
          .orderBy(desc(studentGuardianLinks.invitedAt))
          .limit(3),
        this.db
          .select({
            attendanceDate: attendanceRecords.attendanceDate,
            status: attendanceRecords.status,
          })
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.institutionId, institutionId),
              eq(attendanceRecords.studentId, studentId),
              inArray(attendanceRecords.status, [
                ATTENDANCE_STATUSES.ABSENT,
                ATTENDANCE_STATUSES.LATE,
              ]),
            ),
          )
          .orderBy(desc(attendanceRecords.attendanceDate))
          .limit(3),
        this.db
          .select({
            createdAt: feePayments.createdAt,
            amountInPaise: feePayments.amountInPaise,
            paymentDate: feePayments.paymentDate,
          })
          .from(feePayments)
          .innerJoin(
            feeAssignments,
            eq(feePayments.feeAssignmentId, feeAssignments.id),
          )
          .leftJoin(
            feePaymentReversals,
            eq(feePaymentReversals.feePaymentId, feePayments.id),
          )
          .where(
            and(
              eq(feeAssignments.institutionId, institutionId),
              eq(feeAssignments.studentId, studentId),
              isNull(feePayments.deletedAt),
              isNull(feePaymentReversals.id),
            ),
          )
          .orderBy(desc(feePayments.paymentDate), desc(feePayments.createdAt))
          .limit(3),
        this.db
          .select({
            examTermName: examTerms.name,
            endDate: examTerms.endDate,
            totalMaxMarks: sql<number>`coalesce(sum(${examMarks.maxMarks}), 0)`,
            totalObtainedMarks: sql<number>`coalesce(sum(${examMarks.obtainedMarks}), 0)`,
          })
          .from(examMarks)
          .innerJoin(examTerms, eq(examMarks.examTermId, examTerms.id))
          .where(
            and(
              eq(examMarks.institutionId, institutionId),
              eq(examMarks.studentId, studentId),
              eq(examTerms.institutionId, institutionId),
              isNull(examTerms.deletedAt),
            ),
          )
          .groupBy(examTerms.id, examTerms.name, examTerms.endDate)
          .orderBy(desc(examTerms.endDate))
          .limit(2),
      ]);

    const events: StudentTimelineEvent[] = [];

    if (studentRow) {
      events.push({
        type: STUDENT_TIMELINE_EVENT_TYPES.PROFILE,
        title: "Student profile created",
        description: "The student record was added to this institution.",
        occurredAt: studentRow.createdAt.toISOString(),
      });
    }

    for (const row of guardianRows) {
      events.push({
        type: STUDENT_TIMELINE_EVENT_TYPES.GUARDIAN,
        title: "Guardian linked",
        description: `${row.name} was linked as ${row.relationship}.`,
        occurredAt: row.invitedAt.toISOString(),
      });
    }

    for (const row of attendanceRows) {
      events.push({
        type: STUDENT_TIMELINE_EVENT_TYPES.ATTENDANCE,
        title:
          row.status === ATTENDANCE_STATUSES.ABSENT
            ? "Marked absent"
            : "Marked late",
        description: `Attendance updated for ${row.attendanceDate}.`,
        occurredAt: this.toDateTimestamp(row.attendanceDate),
      });
    }

    for (const row of paymentRows) {
      events.push({
        type: STUDENT_TIMELINE_EVENT_TYPES.FEE_PAYMENT,
        title: "Fee payment collected",
        description: `Payment of ${row.amountInPaise / 100} INR recorded for ${row.paymentDate}.`,
        occurredAt: row.createdAt.toISOString(),
      });
    }

    for (const row of examRows) {
      const overallPercent = this.toRoundedPercent(
        Number(row.totalObtainedMarks),
        Number(row.totalMaxMarks),
      );
      events.push({
        type: STUDENT_TIMELINE_EVENT_TYPES.EXAM,
        title: "Exam results published",
        description: `${row.examTermName} recorded at ${overallPercent}%.`,
        occurredAt: this.toDateTimestamp(row.endDate),
      });
    }

    return events
      .sort((left, right) => right.occurredAt.localeCompare(left.occurredAt))
      .slice(0, STUDENT_TIMELINE_LIMIT);
  }

  async createStudent(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes = {
      campusIds: "all",
      classIds: "all",
      sectionIds: "all",
    },
    payload: CreateStudentDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    const activeCampusScopes = this.scopeToActiveCampus(authSession, scopes);
    const selectedCampus = await this.getCampus(institutionId, activeCampusId);
    const nextCurrentEnrollment = payload.currentEnrollment ?? null;

    if (nextCurrentEnrollment) {
      await this.getAcademicYear(
        institutionId,
        nextCurrentEnrollment.academicYearId,
      );
    }

    const studentPlacement = await this.getResolvedClassSection(
      institutionId,
      payload.classId,
      payload.sectionId,
    );
    this.assertClassMatchesCampus(studentPlacement, selectedCampus.id);

    const resolvedCurrentEnrollment = nextCurrentEnrollment
      ? await this.getResolvedClassSection(
          institutionId,
          nextCurrentEnrollment.classId,
          nextCurrentEnrollment.sectionId,
        )
      : null;

    if (resolvedCurrentEnrollment) {
      this.assertClassMatchesCampus(
        resolvedCurrentEnrollment,
        selectedCampus.id,
      );
    }

    await this.assertAdmissionNumberAvailable(
      institutionId,
      payload.admissionNumber.trim(),
    );

    const customFieldValues =
      await this.admissionFormFieldsService.validateValues(
        institutionId,
        ADMISSION_FORM_FIELD_SCOPES.STUDENT,
        payload.customFieldValues ?? undefined,
      );

    const createdStudent = await this.db.transaction(async (tx) => {
      const studentMembershipId = randomUUID();
      const studentId = randomUUID();

      await tx.insert(member).values({
        id: studentMembershipId,
        organizationId: institutionId,
        userId: null,
        primaryCampusId: selectedCampus.id,
        memberType: MEMBER_TYPES.STUDENT,
        status: STATUS.MEMBER.ACTIVE,
      });

      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId: studentMembershipId,
        campusId: selectedCampus.id,
      });

      await tx.insert(students).values({
        id: studentId,
        institutionId,
        membershipId: studentMembershipId,
        admissionNumber: payload.admissionNumber.trim(),
        firstName: payload.firstName.trim(),
        lastName: payload.lastName?.trim() || null,
        classId: studentPlacement.classId,
        sectionId: studentPlacement.sectionId,
        customFieldValues,
      });

      for (const guardianPayload of payload.guardians) {
        const guardianMembershipId = await this.getOrCreateGuardianMembership(
          tx,
          institutionId,
          selectedCampus.id,
          guardianPayload,
        );

        await tx.insert(studentGuardianLinks).values({
          id: randomUUID(),
          studentMembershipId,
          parentMembershipId: guardianMembershipId,
          relationship: guardianPayload.relationship,
          isPrimary: guardianPayload.isPrimary,
          acceptedAt: null,
          deletedAt: null,
        });
      }

      await this.syncCurrentEnrollment(
        tx,
        institutionId,
        studentMembershipId,
        nextCurrentEnrollment,
        resolvedCurrentEnrollment,
      );

      return {
        id: studentId,
        membershipId: studentMembershipId,
      };
    });

    const [studentRecord] = (
      await this.listStudentsForInstitution(institutionId, activeCampusScopes)
    ).filter((row) => row.id === createdStudent.id);

    if (!studentRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return studentRecord;
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [matchedCampus] = await this.db
      .select({
        id: campus.id,
        name: campus.name,
      })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private async listGuardiansForStudentMemberships(
    studentMembershipIds: string[],
  ) {
    if (studentMembershipIds.length === 0) {
      return new Map<string, StudentGuardianSummary[]>();
    }

    const guardianRows = await this.db
      .select({
        studentMembershipId: studentGuardianLinks.studentMembershipId,
        membershipId: member.id,
        userId: user.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        relationship: studentGuardianLinks.relationship,
        isPrimary: studentGuardianLinks.isPrimary,
      })
      .from(studentGuardianLinks)
      .innerJoin(member, eq(studentGuardianLinks.parentMembershipId, member.id))
      .innerJoin(user, eq(member.userId, user.id))
      .where(
        and(
          inArray(
            studentGuardianLinks.studentMembershipId,
            studentMembershipIds,
          ),
          isNull(studentGuardianLinks.deletedAt),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      );

    const grouped = new Map<string, StudentGuardianSummary[]>();

    for (const row of guardianRows) {
      const current = grouped.get(row.studentMembershipId) ?? [];

      current.push({
        membershipId: row.membershipId,
        userId: row.userId,
        name: row.name,
        mobile: row.mobile,
        email: row.email,
        relationship: row.relationship,
        isPrimary: row.isPrimary,
      });

      grouped.set(row.studentMembershipId, current);
    }

    return grouped;
  }

  private async listCurrentEnrollmentForStudentMemberships(
    institutionId: string,
    studentMembershipIds: string[],
  ) {
    if (studentMembershipIds.length === 0) {
      return new Map<string, StudentCurrentEnrollmentSummary>();
    }

    const enrollmentRows = await this.db
      .select({
        studentMembershipId: studentCurrentEnrollments.studentMembershipId,
        academicYearId: academicYears.id,
        academicYearName: academicYears.name,
        classId: studentCurrentEnrollments.classId,
        className: schoolClasses.name,
        sectionId: studentCurrentEnrollments.sectionId,
        sectionName: classSections.name,
      })
      .from(studentCurrentEnrollments)
      .innerJoin(
        academicYears,
        eq(studentCurrentEnrollments.academicYearId, academicYears.id),
      )
      .innerJoin(
        schoolClasses,
        eq(studentCurrentEnrollments.classId, schoolClasses.id),
      )
      .innerJoin(
        classSections,
        eq(studentCurrentEnrollments.sectionId, classSections.id),
      )
      .where(
        and(
          eq(studentCurrentEnrollments.institutionId, institutionId),
          inArray(
            studentCurrentEnrollments.studentMembershipId,
            studentMembershipIds,
          ),
          isNull(studentCurrentEnrollments.deletedAt),
          ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
        ),
      );

    return new Map(
      enrollmentRows.map((row) => [
        row.studentMembershipId,
        {
          academicYearId: row.academicYearId,
          academicYearName: row.academicYearName,
          classId: row.classId,
          className: row.className,
          sectionId: row.sectionId,
          sectionName: row.sectionName,
        },
      ]),
    );
  }

  private async assertAdmissionNumberAvailable(
    institutionId: string,
    admissionNumber: string,
    studentIdToIgnore?: string,
  ) {
    const matchedStudents = await this.db
      .select({ id: students.id })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.admissionNumber, admissionNumber),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(studentIdToIgnore ? 2 : 1);

    const matchedStudent = matchedStudents.find(
      (student) => student.id !== studentIdToIgnore,
    );

    if (matchedStudent) {
      throw new ConflictException(
        ERROR_MESSAGES.STUDENTS.ADMISSION_NUMBER_EXISTS,
      );
    }
  }

  private async getOrCreateGuardianMembership(
    tx: StudentsWriter,
    institutionId: string,
    campusId: string,
    guardianPayload: CreateGuardianLinkDto,
  ) {
    const normalizedMobile = normalizeMobile(guardianPayload.mobile);
    const normalizedEmail = normalizeOptionalEmail(guardianPayload.email);
    const matchedUser = await this.findUserByIdentity(
      tx,
      normalizedMobile,
      normalizedEmail,
      guardianPayload.name.trim(),
    );
    let guardianUserId = matchedUser?.id ?? null;

    if (!guardianUserId) {
      guardianUserId = randomUUID();

      await tx.insert(user).values({
        id: guardianUserId,
        name: guardianPayload.name.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
        passwordHash: await hash(randomUUID(), 12),
      });
    }

    const [matchedMembership] = await tx
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.userId, guardianUserId),
          eq(member.memberType, MEMBER_TYPES.GUARDIAN),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    const guardianMembershipId = matchedMembership?.id ?? randomUUID();

    if (!matchedMembership) {
      await tx.insert(member).values({
        id: guardianMembershipId,
        organizationId: institutionId,
        userId: guardianUserId,
        primaryCampusId: campusId,
        memberType: MEMBER_TYPES.GUARDIAN,
        status: STATUS.MEMBER.ACTIVE,
      });
    }

    await this.ensureCampusMembership(tx, guardianMembershipId, campusId);

    return guardianMembershipId;
  }

  private async ensureCampusMembership(
    tx: StudentsWriter,
    membershipId: string,
    campusId: string,
  ) {
    const [campusMembership] = await tx
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

    if (!campusMembership) {
      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId,
        campusId,
      });
    }
  }

  private async getStudentMembership(
    institutionId: string,
    studentId: string,
    campusId: string,
  ) {
    const [matchedStudent] = await this.db
      .select({
        id: students.id,
        membershipId: students.membershipId,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.id, studentId),
          eq(students.institutionId, institutionId),
          eq(member.primaryCampusId, campusId),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!matchedStudent) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return matchedStudent;
  }

  private async getAcademicYear(institutionId: string, academicYearId: string) {
    const [matchedAcademicYear] = await this.db
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

    if (!matchedAcademicYear) {
      throw new NotFoundException(ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND);
    }

    return matchedAcademicYear;
  }

  private async syncCurrentEnrollment(
    tx: StudentsWriter,
    institutionId: string,
    studentMembershipId: string,
    currentEnrollment: CurrentEnrollmentDto | null,
    resolvedCurrentEnrollment: ResolvedClassSection | null,
  ) {
    const [existingEnrollment] = await tx
      .select({
        id: studentCurrentEnrollments.id,
      })
      .from(studentCurrentEnrollments)
      .where(
        and(
          eq(studentCurrentEnrollments.institutionId, institutionId),
          eq(
            studentCurrentEnrollments.studentMembershipId,
            studentMembershipId,
          ),
          isNull(studentCurrentEnrollments.deletedAt),
        ),
      )
      .limit(1);

    if (!currentEnrollment) {
      if (existingEnrollment) {
        await tx
          .update(studentCurrentEnrollments)
          .set({
            deletedAt: new Date(),
          })
          .where(eq(studentCurrentEnrollments.id, existingEnrollment.id));
      }

      return;
    }

    const nextValues = {
      academicYearId: currentEnrollment.academicYearId,
      classId: resolvedCurrentEnrollment?.classId ?? currentEnrollment.classId,
      sectionId:
        resolvedCurrentEnrollment?.sectionId ?? currentEnrollment.sectionId,
      deletedAt: null,
    } as const;

    if (existingEnrollment) {
      await tx
        .update(studentCurrentEnrollments)
        .set(nextValues)
        .where(eq(studentCurrentEnrollments.id, existingEnrollment.id));

      return;
    }

    await tx.insert(studentCurrentEnrollments).values({
      id: randomUUID(),
      institutionId,
      studentMembershipId,
      ...nextValues,
    });
  }

  private async findUserByIdentity(
    tx: StudentsWriter,
    mobile: string,
    email: string | null,
    name: string,
  ) {
    const [matchedMobileUser] = await tx
      .select({
        id: user.id,
        mobile: user.mobile,
        email: user.email,
      })
      .from(user)
      .where(eq(user.mobile, mobile))
      .limit(1);

    const [matchedEmailUser] = email
      ? await tx
          .select({
            id: user.id,
            mobile: user.mobile,
            email: user.email,
          })
          .from(user)
          .where(eq(user.email, email))
          .limit(1)
      : [];

    if (
      matchedMobileUser &&
      matchedEmailUser &&
      matchedMobileUser.id !== matchedEmailUser.id
    ) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    if (matchedMobileUser) {
      if (email && matchedMobileUser.email === null) {
        await tx
          .update(user)
          .set({
            email,
            name,
          })
          .where(eq(user.id, matchedMobileUser.id));
      }

      return {
        ...matchedMobileUser,
        email: matchedMobileUser.email ?? email,
      };
    }

    if (matchedEmailUser) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }

    return null;
  }

  private async getResolvedClassSection(
    institutionId: string,
    classId: string,
    sectionId: string,
  ) {
    const [resolvedClassSection] = await this.db
      .select({
        classId: schoolClasses.id,
        className: schoolClasses.name,
        classCampusId: schoolClasses.campusId,
        sectionId: classSections.id,
        sectionName: classSections.name,
      })
      .from(classSections)
      .innerJoin(schoolClasses, eq(classSections.classId, schoolClasses.id))
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          eq(classSections.institutionId, institutionId),
          eq(schoolClasses.id, classId),
          eq(classSections.id, sectionId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
          eq(classSections.status, STATUS.SECTION.ACTIVE),
        ),
      )
      .limit(1);

    if (!resolvedClassSection) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.SECTION_NOT_FOUND);
    }

    return resolvedClassSection;
  }

  private assertClassMatchesCampus(
    resolvedClassSection: ResolvedClassSection,
    campusId: string,
  ) {
    if (resolvedClassSection.classCampusId !== campusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.STUDENTS.CLASS_CAMPUS_MISMATCH,
      );
    }
  }

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private scopeToActiveCampus(
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): ResolvedScopes {
    const activeCampusId = this.requireActiveCampusId(authSession);

    if (
      scopes.campusIds !== "all" &&
      !scopes.campusIds.includes(activeCampusId)
    ) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return {
      ...scopes,
      campusIds: [activeCampusId],
    };
  }

  private getCurrentDateString() {
    return new Date().toISOString().slice(0, 10);
  }

  private getDateDaysAgoString(daysAgo: number) {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - daysAgo);

    return date.toISOString().slice(0, 10);
  }

  private toDateTimestamp(date: string) {
    return new Date(`${date}T00:00:00.000Z`).toISOString();
  }

  private toRoundedPercent(obtained: number, max: number) {
    if (max <= 0) {
      return 0;
    }

    return Number(((obtained / max) * 100).toFixed(2));
  }

  private resolveExamGrade(percent: number) {
    const matchedBand = EXAM_GRADING_SCHEME.find(
      (band) => percent >= band.minPercent,
    );

    return matchedBand?.grade ?? "E";
  }
}
