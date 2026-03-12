import { DATABASE } from "@repo/backend-core";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  campus,
  campusMemberships,
  member,
  studentGuardianLinks,
  students,
  user,
} from "@repo/database";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  GUARDIAN_RELATIONSHIPS,
  MEMBER_TYPES,
  STATUS,
} from "../../constants";
import { AuthService } from "../auth/auth.service";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import type {
  CreateGuardianLinkDto,
  CreateStudentDto,
} from "./students.schemas";

type StudentGuardianSummary = {
  membershipId: string;
  userId: string | null;
  name: string;
  mobile: string;
  email: string | null;
  relationship: (typeof GUARDIAN_RELATIONSHIPS)[keyof typeof GUARDIAN_RELATIONSHIPS];
  isPrimary: boolean;
};

type StudentsWriter = Pick<AppDatabase, "insert" | "select" | "update">;

@Injectable()
export class StudentsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listStudents(institutionId: string, actorUserId: string) {
    await this.requireInstitutionAccess(actorUserId, institutionId);

    const studentRows = await this.db
      .select({
        id: students.id,
        membershipId: students.membershipId,
        institutionId: students.institutionId,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        campusId: campus.id,
        campusName: campus.name,
        status: member.status,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
          isNull(member.deletedAt),
          isNull(campus.deletedAt),
        ),
      );

    const guardiansByStudent = await this.listGuardiansForStudentMemberships(
      studentRows.map((row) => row.membershipId),
    );

    return studentRows.map((row) => ({
      ...row,
      fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
      guardians: guardiansByStudent.get(row.membershipId) ?? [],
    }));
  }

  async createStudent(
    institutionId: string,
    actorUserId: string,
    payload: CreateStudentDto,
  ) {
    await this.requireInstitutionAccess(actorUserId, institutionId);

    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
    await this.assertAdmissionNumberAvailable(
      institutionId,
      payload.admissionNumber.trim(),
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

      return {
        id: studentId,
        membershipId: studentMembershipId,
      };
    });

    const [studentRecord] = (
      await this.listStudents(institutionId, actorUserId)
    ).filter((row) => row.id === createdStudent.id);

    if (!studentRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return studentRecord;
  }

  private async requireInstitutionAccess(
    userId: string,
    institutionId: string,
  ) {
    const membership = await this.authService.getMembershipForOrganization(
      userId,
      institutionId,
    );

    if (!membership) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }
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
          isNull(campus.deletedAt),
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
          isNull(member.deletedAt),
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

  private async assertAdmissionNumberAvailable(
    institutionId: string,
    admissionNumber: string,
  ) {
    const [matchedStudent] = await this.db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.admissionNumber, admissionNumber),
          isNull(students.deletedAt),
        ),
      )
      .limit(1);

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
          isNull(member.deletedAt),
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

    const [guardianCampusMembership] = await tx
      .select({ id: campusMemberships.id })
      .from(campusMemberships)
      .where(
        and(
          eq(campusMemberships.membershipId, guardianMembershipId),
          eq(campusMemberships.campusId, campusId),
          isNull(campusMemberships.deletedAt),
        ),
      )
      .limit(1);

    if (!guardianCampusMembership) {
      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId: guardianMembershipId,
        campusId,
      });
    }

    return guardianMembershipId;
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
}
