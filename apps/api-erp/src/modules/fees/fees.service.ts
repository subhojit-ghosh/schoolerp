import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import {
  AUTH_CONTEXT_KEYS,
  FEE_ASSIGNMENT_STATUSES,
  FEE_STRUCTURE_SCOPES,
} from "@repo/contracts";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  campus,
  feeAssignments,
  feePayments,
  feeStructures,
  member,
  students,
} from "@repo/database";
import { and, asc, eq, inArray, isNull, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES } from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import type {
  CreateFeeAssignmentDto,
  CreateFeePaymentDto,
  CreateFeeStructureDto,
} from "./fees.schemas";

type PaymentSummary = {
  totalPaidAmountInPaise: number;
  paymentCount: number;
};

@Injectable()
export class FeesService {
  constructor(
    @Inject(DATABASE) private readonly database: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listFeeStructures(
    institutionId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const rows = await this.database
      .select({
        id: feeStructures.id,
        institutionId: feeStructures.institutionId,
        academicYearId: feeStructures.academicYearId,
        academicYearName: academicYears.name,
        campusId: feeStructures.campusId,
        campusName: campus.name,
        name: feeStructures.name,
        description: feeStructures.description,
        scope: feeStructures.scope,
        amountInPaise: feeStructures.amountInPaise,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .where(
        and(
          eq(feeStructures.institutionId, institutionId),
          isNull(feeStructures.deletedAt),
        ),
      )
      .orderBy(asc(academicYears.startDate), asc(feeStructures.name));

    return rows.map((row) => ({
      ...row,
      campusName: row.campusName ?? null,
      description: row.description ?? null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createFeeStructure(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateFeeStructureDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const academicYear = await this.getAcademicYearOrThrow(
      institutionId,
      payload.academicYearId,
    );
    const selectedCampus =
      payload.scope === FEE_STRUCTURE_SCOPES.CAMPUS
        ? await this.getCampusOrThrow(institutionId, payload.campusId)
        : null;

    const normalizedCampusId =
      payload.scope === FEE_STRUCTURE_SCOPES.CAMPUS && selectedCampus
        ? selectedCampus.id
        : null;

    await this.assertFeeStructureNameAvailable(
      institutionId,
      payload.academicYearId,
      normalizedCampusId,
      payload.name.trim(),
    );

    const createdId = randomUUID();

    await this.database.insert(feeStructures).values({
      id: createdId,
      institutionId,
      academicYearId: academicYear.id,
      campusId: normalizedCampusId,
      name: payload.name.trim(),
      description: payload.description ?? null,
      scope: payload.scope,
      amountInPaise: this.toPaise(
        payload.amount,
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_AMOUNT_INVALID,
      ),
      dueDate: payload.dueDate,
    });

    return this.getFeeStructureById(createdId, institutionId);
  }

  async listFeeAssignments(
    institutionId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    return this.listFeeAssignmentsForInstitution(institutionId);
  }

  async createFeeAssignment(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateFeeAssignmentDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const feeStructure = await this.getFeeStructureOrThrow(
      institutionId,
      payload.feeStructureId,
    );
    const student = await this.getStudentOrThrow(
      institutionId,
      payload.studentId,
    );

    if (
      feeStructure.scope === FEE_STRUCTURE_SCOPES.CAMPUS &&
      feeStructure.campusId !== student.campusId
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_CAMPUS_MISMATCH,
      );
    }

    await this.assertFeeAssignmentAvailable(
      institutionId,
      payload.studentId,
      payload.feeStructureId,
    );

    const createdId = randomUUID();

    await this.database.insert(feeAssignments).values({
      id: createdId,
      institutionId,
      feeStructureId: feeStructure.id,
      studentId: student.id,
      assignedAmountInPaise: this.toPaise(
        payload.amount,
        ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_AMOUNT_INVALID,
      ),
      dueDate: payload.dueDate,
      status: FEE_ASSIGNMENT_STATUSES.PENDING,
      notes: payload.notes ?? null,
    });

    return this.getFeeAssignmentById(createdId, institutionId);
  }

  async createFeePayment(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateFeePaymentDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const assignment = await this.getFeeAssignmentOrThrow(
      institutionId,
      payload.feeAssignmentId,
    );
    const paymentAmountInPaise = this.toPaise(
      payload.amount,
      ERROR_MESSAGES.FEES.FEE_PAYMENT_AMOUNT_INVALID,
    );

    if (paymentAmountInPaise > assignment.outstandingAmountInPaise) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_PAYMENT_EXCEEDS_DUE,
      );
    }

    const paymentId = randomUUID();
    const nextPaidAmountInPaise =
      assignment.paidAmountInPaise + paymentAmountInPaise;
    const nextOutstandingAmountInPaise =
      assignment.assignedAmountInPaise - nextPaidAmountInPaise;

    await this.database.transaction(async (tx) => {
      await tx.insert(feePayments).values({
        id: paymentId,
        institutionId,
        feeAssignmentId: assignment.id,
        amountInPaise: paymentAmountInPaise,
        paymentDate: payload.paymentDate,
        paymentMethod: payload.paymentMethod,
        referenceNumber: payload.referenceNumber ?? null,
        notes: payload.notes ?? null,
      });

      await tx
        .update(feeAssignments)
        .set({
          status: this.resolveAssignmentStatus(
            nextPaidAmountInPaise,
            nextOutstandingAmountInPaise,
          ),
        })
        .where(eq(feeAssignments.id, assignment.id));
    });

    return this.getFeePaymentById(paymentId, institutionId);
  }

  async listFeeDues(institutionId: string, authSession: AuthenticatedSession) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const assignments =
      await this.listFeeAssignmentsForInstitution(institutionId);

    return assignments.filter(
      (assignment) => assignment.outstandingAmountInPaise > 0,
    );
  }

  private async listFeeAssignmentsForInstitution(institutionId: string) {
    const rows = await this.database
      .select({
        id: feeAssignments.id,
        institutionId: feeAssignments.institutionId,
        feeStructureId: feeAssignments.feeStructureId,
        feeStructureName: feeStructures.name,
        studentId: feeAssignments.studentId,
        studentAdmissionNumber: students.admissionNumber,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        campusName: campus.name,
        assignedAmountInPaise: feeAssignments.assignedAmountInPaise,
        dueDate: feeAssignments.dueDate,
        status: feeAssignments.status,
        notes: feeAssignments.notes,
        createdAt: feeAssignments.createdAt,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .leftJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          isNull(feeAssignments.deletedAt),
          isNull(feeStructures.deletedAt),
          isNull(students.deletedAt),
          isNull(member.deletedAt),
        ),
      )
      .orderBy(asc(feeAssignments.dueDate), asc(students.admissionNumber));

    const paymentSummaryByAssignment =
      await this.getPaymentSummaryByAssignmentIds(rows.map((row) => row.id));

    return rows.map((row) => {
      const paymentSummary = paymentSummaryByAssignment.get(row.id) ?? {
        totalPaidAmountInPaise: 0,
        paymentCount: 0,
      };
      const outstandingAmountInPaise =
        row.assignedAmountInPaise - paymentSummary.totalPaidAmountInPaise;

      return {
        id: row.id,
        institutionId: row.institutionId,
        feeStructureId: row.feeStructureId,
        feeStructureName: row.feeStructureName,
        studentId: row.studentId,
        studentAdmissionNumber: row.studentAdmissionNumber,
        studentFullName: [row.studentFirstName, row.studentLastName]
          .filter(Boolean)
          .join(" "),
        campusName: row.campusName ?? null,
        assignedAmountInPaise: row.assignedAmountInPaise,
        paidAmountInPaise: paymentSummary.totalPaidAmountInPaise,
        outstandingAmountInPaise,
        paymentCount: paymentSummary.paymentCount,
        dueDate: row.dueDate,
        status: row.status,
        notes: row.notes ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  private async getPaymentSummaryByAssignmentIds(assignmentIds: string[]) {
    if (assignmentIds.length === 0) {
      return new Map<string, PaymentSummary>();
    }

    const rows = await this.database
      .select({
        feeAssignmentId: feePayments.feeAssignmentId,
        totalPaidAmountInPaise: sql<number>`coalesce(sum(${feePayments.amountInPaise}), 0)`,
        paymentCount: sql<number>`count(${feePayments.id})`,
      })
      .from(feePayments)
      .where(
        and(
          inArray(feePayments.feeAssignmentId, assignmentIds),
          isNull(feePayments.deletedAt),
        ),
      )
      .groupBy(feePayments.feeAssignmentId);

    return new Map(
      rows.map((row) => [
        row.feeAssignmentId,
        {
          totalPaidAmountInPaise: Number(row.totalPaidAmountInPaise),
          paymentCount: Number(row.paymentCount),
        },
      ]),
    );
  }

  private async getFeeStructureById(id: string, institutionId: string) {
    const [matched] = await this.database
      .select({
        id: feeStructures.id,
        institutionId: feeStructures.institutionId,
        academicYearId: feeStructures.academicYearId,
        academicYearName: academicYears.name,
        campusId: feeStructures.campusId,
        campusName: campus.name,
        name: feeStructures.name,
        description: feeStructures.description,
        scope: feeStructures.scope,
        amountInPaise: feeStructures.amountInPaise,
        dueDate: feeStructures.dueDate,
        createdAt: feeStructures.createdAt,
      })
      .from(feeStructures)
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .leftJoin(campus, eq(feeStructures.campusId, campus.id))
      .where(
        and(
          eq(feeStructures.id, id),
          eq(feeStructures.institutionId, institutionId),
          isNull(feeStructures.deletedAt),
        ),
      )
      .limit(1);

    if (!matched) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_STRUCTURE_NOT_FOUND);
    }

    return {
      ...matched,
      campusName: matched.campusName ?? null,
      description: matched.description ?? null,
      createdAt: matched.createdAt.toISOString(),
    };
  }

  private async getFeeAssignmentById(id: string, institutionId: string) {
    const assignments =
      await this.listFeeAssignmentsForInstitution(institutionId);
    const matched = assignments.find((assignment) => assignment.id === id);

    if (!matched) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_NOT_FOUND);
    }

    return matched;
  }

  private async getFeePaymentById(id: string, institutionId: string) {
    const [payment] = await this.database
      .select({
        id: feePayments.id,
        institutionId: feePayments.institutionId,
        feeAssignmentId: feePayments.feeAssignmentId,
        amountInPaise: feePayments.amountInPaise,
        paymentDate: feePayments.paymentDate,
        paymentMethod: feePayments.paymentMethod,
        referenceNumber: feePayments.referenceNumber,
        notes: feePayments.notes,
        createdAt: feePayments.createdAt,
      })
      .from(feePayments)
      .where(
        and(
          eq(feePayments.id, id),
          eq(feePayments.institutionId, institutionId),
          isNull(feePayments.deletedAt),
        ),
      )
      .limit(1);

    if (!payment) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_PAYMENT_NOT_FOUND);
    }

    return {
      ...payment,
      referenceNumber: payment.referenceNumber ?? null,
      notes: payment.notes ?? null,
      createdAt: payment.createdAt.toISOString(),
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
          isNull(academicYears.deletedAt),
        ),
      )
      .limit(1);

    if (!academicYear) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.ACADEMIC_YEAR_NOT_FOUND);
    }

    return academicYear;
  }

  private async getCampusOrThrow(
    institutionId: string,
    campusId: string | undefined,
  ) {
    if (!campusId) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_SCOPE_INVALID,
      );
    }

    const [matchedCampus] = await this.database
      .select({
        id: campus.id,
        name: campus.name,
      })
      .from(campus)
      .where(
        and(
          eq(campus.id, campusId),
          eq(campus.organizationId, institutionId),
          isNull(campus.deletedAt),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private async getStudentOrThrow(institutionId: string, studentId: string) {
    const [student] = await this.database
      .select({
        id: students.id,
        campusId: member.primaryCampusId,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.id, studentId),
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
          isNull(member.deletedAt),
        ),
      )
      .limit(1);

    if (!student) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return student;
  }

  private async getFeeStructureOrThrow(
    institutionId: string,
    feeStructureId: string,
  ) {
    const [feeStructure] = await this.database
      .select({
        id: feeStructures.id,
        campusId: feeStructures.campusId,
        scope: feeStructures.scope,
      })
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.id, feeStructureId),
          eq(feeStructures.institutionId, institutionId),
          isNull(feeStructures.deletedAt),
        ),
      )
      .limit(1);

    if (!feeStructure) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_STRUCTURE_NOT_FOUND);
    }

    return feeStructure;
  }

  private async getFeeAssignmentOrThrow(
    institutionId: string,
    feeAssignmentId: string,
  ) {
    const assignments =
      await this.listFeeAssignmentsForInstitution(institutionId);
    const matched = assignments.find(
      (assignment) => assignment.id === feeAssignmentId,
    );

    if (!matched) {
      throw new NotFoundException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_NOT_FOUND);
    }

    return matched;
  }

  private async assertFeeStructureNameAvailable(
    institutionId: string,
    academicYearId: string,
    campusId: string | null,
    name: string,
  ) {
    const [existingStructure] = await this.database
      .select({ id: feeStructures.id })
      .from(feeStructures)
      .where(
        and(
          eq(feeStructures.institutionId, institutionId),
          eq(feeStructures.academicYearId, academicYearId),
          campusId
            ? eq(feeStructures.campusId, campusId)
            : isNull(feeStructures.campusId),
          eq(feeStructures.name, name),
          isNull(feeStructures.deletedAt),
        ),
      )
      .limit(1);

    if (existingStructure) {
      throw new ConflictException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_NAME_EXISTS,
      );
    }
  }

  private async assertFeeAssignmentAvailable(
    institutionId: string,
    studentId: string,
    feeStructureId: string,
  ) {
    const [existingAssignment] = await this.database
      .select({ id: feeAssignments.id })
      .from(feeAssignments)
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          eq(feeAssignments.studentId, studentId),
          eq(feeAssignments.feeStructureId, feeStructureId),
          isNull(feeAssignments.deletedAt),
        ),
      )
      .limit(1);

    if (existingAssignment) {
      throw new ConflictException(ERROR_MESSAGES.FEES.FEE_ASSIGNMENT_EXISTS);
    }
  }

  private resolveAssignmentStatus(
    paidAmountInPaise: number,
    outstandingAmountInPaise: number,
  ) {
    if (outstandingAmountInPaise <= 0) {
      return FEE_ASSIGNMENT_STATUSES.PAID;
    }

    if (paidAmountInPaise > 0) {
      return FEE_ASSIGNMENT_STATUSES.PARTIAL;
    }

    return FEE_ASSIGNMENT_STATUSES.PENDING;
  }

  private toPaise(amount: number, errorMessage: string) {
    const amountInPaise = Math.round(amount * 100);

    if (amountInPaise <= 0) {
      throw new BadRequestException(errorMessage);
    }

    return amountInPaise;
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
