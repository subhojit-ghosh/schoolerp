import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  campus,
  classSections,
  campusMemberships,
  member,
  schoolClasses,
  studentCurrentEnrollments,
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
import type { AuthenticatedSession } from "../auth/auth.types";
import type {
  CreateGuardianLinkDto,
  CurrentEnrollmentDto,
  CreateStudentDto,
  UpdateStudentDto,
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

@Injectable()
export class StudentsService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listStudents(institutionId: string, authSession: AuthenticatedSession) {
    await this.requireInstitutionAccess(authSession, institutionId);

    return this.listStudentsForInstitution(institutionId);
  }

  async getStudent(
    institutionId: string,
    studentId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const [studentRecord] = await this.listStudentsForInstitution(
      institutionId,
      studentId,
    );

    if (!studentRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return studentRecord;
  }

  async updateStudent(
    institutionId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    payload: UpdateStudentDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const existingStudent = await this.getStudentMembership(
      institutionId,
      studentId,
    );
    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
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

    return this.getStudent(institutionId, studentId, authSession);
  }

  private async listStudentsForInstitution(
    institutionId: string,
    studentId?: string,
  ) {
    const studentRows = await this.db
      .select({
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
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          studentId ? eq(students.id, studentId) : undefined,
          isNull(students.deletedAt),
          isNull(member.deletedAt),
          isNull(campus.deletedAt),
          isNull(schoolClasses.deletedAt),
          isNull(classSections.deletedAt),
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

  async createStudent(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateStudentDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
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
      await this.listStudentsForInstitution(institutionId)
    ).filter((row) => row.id === createdStudent.id);

    if (!studentRecord) {
      throw new NotFoundException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return studentRecord;
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
          isNull(academicYears.deletedAt),
          isNull(schoolClasses.deletedAt),
          isNull(classSections.deletedAt),
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
      .where(
        and(
          eq(students.institutionId, institutionId),
          eq(students.admissionNumber, admissionNumber),
          isNull(students.deletedAt),
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

  private async getStudentMembership(institutionId: string, studentId: string) {
    const [matchedStudent] = await this.db
      .select({
        id: students.id,
        membershipId: students.membershipId,
      })
      .from(students)
      .where(
        and(
          eq(students.id, studentId),
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
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
          isNull(academicYears.deletedAt),
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
          isNull(schoolClasses.deletedAt),
          isNull(classSections.deletedAt),
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
}
