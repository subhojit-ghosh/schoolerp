import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import type { GuardianRelationship } from "@repo/contracts";
import { DATABASE } from "@repo/backend-core";
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  asc,
  campus,
  campusMemberships,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNotNull,
  isNull,
  member,
  ne,
  or,
  studentGuardianLinks,
  students,
  type SQL,
  user,
} from "@repo/database";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { normalizeMobile, normalizeOptionalEmail } from "../auth/auth.utils";
import { AuditService } from "../audit/audit.service";
import { AuthService } from "../auth/auth.service";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  SORT_ORDERS,
  STATUS,
  type MemberStatus,
} from "../../constants";
import {
  resolvePagination,
  resolveTablePageSize,
  type PaginatedResult,
} from "../../lib/list-query";
import type {
  LinkGuardianStudentDto,
  ListGuardiansQueryDto,
  UpdateGuardianDto,
  UpdateGuardianStudentLinkDto,
} from "./guardians.schemas";
import { sortableGuardianColumns } from "./guardians.schemas";

type GuardiansWriter = Pick<AppDatabase, "insert" | "select" | "update">;

type GuardianStudentLinkRecord = {
  id: string;
  parentMembershipId: string;
  isPrimary: boolean;
};

type GuardianLinkedStudentSummary = {
  studentId: string;
  membershipId: string;
  fullName: string;
  admissionNumber: string;
  campusId: string;
  campusName: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
};

type GuardianSummary = {
  id: string;
  userId: string | null;
  institutionId: string;
  name: string;
  mobile: string;
  email: string | null;
  campusId: string;
  campusName: string;
  status: MemberStatus;
  linkedStudents: GuardianLinkedStudentSummary[];
};

const sortableColumns = {
  campus: campus.name,
  name: user.name,
  status: member.status,
} as const;

@Injectable()
export class GuardiansService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  async listGuardians(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListGuardiansQueryDto = {},
  ): Promise<PaginatedResult<GuardianSummary>> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getCampus(institutionId, activeCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableGuardianColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.GUARDIAN),
      ne(member.status, STATUS.MEMBER.DELETED),
      ne(campus.status, STATUS.CAMPUS.DELETED),
    ];

    conditions.push(eq(member.primaryCampusId, activeCampusId));

    if (query.search) {
      conditions.push(
        or(
          ilike(user.name, `%${query.search}%`),
          ilike(user.mobile, `%${query.search}%`),
          ilike(user.email, `%${query.search}%`),
        )!,
      );
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const guardianRows = await this.db
      .select(this.guardianSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(where)
      .orderBy(sortDirection(sortableColumns[sortKey]), asc(user.name))
      .limit(pageSize)
      .offset(pagination.offset);

    const linkedStudentsByGuardianId =
      await this.listLinkedStudentsForGuardians(
        guardianRows.map((row) => row.id),
      );

    return {
      rows: guardianRows.map((row) => ({
        ...row,
        linkedStudents: linkedStudentsByGuardianId.get(row.id) ?? [],
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getGuardian(
    institutionId: string,
    guardianId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const [guardianRecord] = await this.listGuardiansForInstitution(
      institutionId,
      activeCampusId,
      guardianId,
    );

    if (!guardianRecord) {
      throw new NotFoundException(ERROR_MESSAGES.GUARDIANS.GUARDIAN_NOT_FOUND);
    }

    return guardianRecord;
  }

  async upsertGuardian(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateGuardianDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const selectedCampus = await this.getCampus(institutionId, activeCampusId);
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);
    const existingGuardian = await this.findGuardianMembershipByIdentity(
      institutionId,
      normalizedMobile,
      normalizedEmail,
    );

    if (existingGuardian) {
      await this.assertGuardianIdentityAvailable(
        institutionId,
        existingGuardian.userId,
        normalizedMobile,
        normalizedEmail,
      );

      await this.db.transaction(async (tx) => {
        await tx
          .update(user)
          .set({
            name: payload.name.trim(),
            mobile: normalizedMobile,
            email: normalizedEmail,
          })
          .where(eq(user.id, existingGuardian.userId));

        await tx
          .update(member)
          .set({
            primaryCampusId: selectedCampus.id,
          })
          .where(eq(member.id, existingGuardian.id));

        await this.ensureCampusMembership(
          tx,
          existingGuardian.id,
          selectedCampus.id,
        );
      });

      this.auditService.record({
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.GUARDIAN,
        entityId: existingGuardian.id,
        entityLabel: payload.name.trim(),
        summary: `Updated guardian ${payload.name.trim()}.`,
      }).catch(() => {});

      return this.getGuardian(
        institutionId,
        existingGuardian.id,
        authSession,
        scopes,
      );
    }

    const createdGuardianId = randomUUID();

    await this.db.transaction(async (tx) => {
      // Check if a user already exists in this institution with this mobile
      const [existingUser] = await tx
        .select({ id: user.id })
        .from(user)
        .where(
          and(
            eq(user.institutionId, institutionId),
            eq(user.mobile, normalizedMobile),
          ),
        )
        .limit(1);

      let userId: string;

      if (existingUser) {
        // User exists (different role) — link to existing user, don't overwrite user data
        userId = existingUser.id;
      } else {
        const newUserId = randomUUID();
        await tx.insert(user).values({
          id: newUserId,
          institutionId,
          name: payload.name.trim(),
          mobile: normalizedMobile,
          email: normalizedEmail,
          passwordHash: await hash(normalizedMobile, 12),
          mustChangePassword: true,
        });
        userId = newUserId;
      }

      await tx.insert(member).values({
        id: createdGuardianId,
        organizationId: institutionId,
        userId,
        primaryCampusId: selectedCampus.id,
        memberType: MEMBER_TYPES.GUARDIAN,
        status: STATUS.MEMBER.ACTIVE,
      });

      await this.ensureCampusMembership(
        tx,
        createdGuardianId,
        selectedCampus.id,
      );
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.GUARDIAN,
      entityId: createdGuardianId,
      entityLabel: payload.name.trim(),
      summary: `Created guardian ${payload.name.trim()}.`,
    }).catch(() => {});

    return this.getGuardian(
      institutionId,
      createdGuardianId,
      authSession,
      scopes,
    );
  }

  async updateGuardian(
    institutionId: string,
    guardianId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateGuardianDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const guardianMembership = await this.getGuardianMembership(
      institutionId,
      guardianId,
      activeCampusId,
    );
    const selectedCampus = await this.getCampus(institutionId, activeCampusId);
    const guardianUserId = guardianMembership.userId;
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);

    await this.assertGuardianIdentityAvailable(
      institutionId,
      guardianUserId,
      normalizedMobile,
      normalizedEmail,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(user)
        .set({
          name: payload.name.trim(),
          mobile: normalizedMobile,
          email: normalizedEmail,
        })
        .where(eq(user.id, guardianUserId));

      await tx
        .update(member)
        .set({
          primaryCampusId: selectedCampus.id,
        })
        .where(eq(member.id, guardianMembership.id));

      await this.ensureCampusMembership(
        tx,
        guardianMembership.id,
        selectedCampus.id,
      );
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.GUARDIAN,
      entityId: guardianId,
      entityLabel: payload.name.trim(),
      summary: `Updated guardian ${payload.name.trim()}.`,
    }).catch(() => {});

    return this.getGuardian(institutionId, guardianId, authSession, scopes);
  }

  async linkStudent(
    institutionId: string,
    guardianId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: LinkGuardianStudentDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const guardianMembership = await this.getGuardianMembership(
      institutionId,
      guardianId,
      activeCampusId,
    );
    const studentMembership = await this.getStudentMembership(
      institutionId,
      payload.studentId,
      activeCampusId,
    );

    await this.db.transaction(async (tx) => {
      const [activeLink] = await tx
        .select({ id: studentGuardianLinks.id })
        .from(studentGuardianLinks)
        .where(
          and(
            eq(
              studentGuardianLinks.studentMembershipId,
              studentMembership.membershipId,
            ),
            eq(studentGuardianLinks.parentMembershipId, guardianMembership.id),
            isNull(studentGuardianLinks.deletedAt),
          ),
        )
        .limit(1);

      if (activeLink) {
        await tx
          .update(studentGuardianLinks)
          .set({
            relationship: payload.relationship,
            isPrimary: payload.isPrimary,
          })
          .where(eq(studentGuardianLinks.id, activeLink.id));
      } else {
        const [deletedLink] = await tx
          .select({ id: studentGuardianLinks.id })
          .from(studentGuardianLinks)
          .where(
            and(
              eq(
                studentGuardianLinks.studentMembershipId,
                studentMembership.membershipId,
              ),
              eq(
                studentGuardianLinks.parentMembershipId,
                guardianMembership.id,
              ),
              isNotNull(studentGuardianLinks.deletedAt),
            ),
          )
          .limit(1);

        if (deletedLink) {
          await tx
            .update(studentGuardianLinks)
            .set({
              relationship: payload.relationship,
              isPrimary: payload.isPrimary,
              deletedAt: null,
            })
            .where(eq(studentGuardianLinks.id, deletedLink.id));
        } else {
          await tx.insert(studentGuardianLinks).values({
            id: randomUUID(),
            studentMembershipId: studentMembership.membershipId,
            parentMembershipId: guardianMembership.id,
            relationship: payload.relationship,
            isPrimary: payload.isPrimary,
            deletedAt: null,
          });
        }
      }

      await this.normalizeStudentPrimaryGuardian(
        tx,
        studentMembership.membershipId,
        payload.isPrimary ? guardianMembership.id : undefined,
      );
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.GUARDIAN,
      entityId: guardianId,
      entityLabel: guardianId,
      summary: `Linked student ${payload.studentId} to guardian.`,
    }).catch(() => {});

    return this.getGuardian(institutionId, guardianId, authSession, scopes);
  }

  async updateStudentLink(
    institutionId: string,
    guardianId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateGuardianStudentLinkDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getGuardianMembership(institutionId, guardianId, activeCampusId);
    const studentMembership = await this.getStudentMembership(
      institutionId,
      studentId,
      activeCampusId,
    );

    await this.db.transaction(async (tx) => {
      const [activeLink] = await tx
        .select({ id: studentGuardianLinks.id })
        .from(studentGuardianLinks)
        .where(
          and(
            eq(
              studentGuardianLinks.studentMembershipId,
              studentMembership.membershipId,
            ),
            eq(studentGuardianLinks.parentMembershipId, guardianId),
            isNull(studentGuardianLinks.deletedAt),
          ),
        )
        .limit(1);

      if (!activeLink) {
        throw new NotFoundException(
          ERROR_MESSAGES.GUARDIANS.STUDENT_LINK_NOT_FOUND,
        );
      }

      await tx
        .update(studentGuardianLinks)
        .set({
          relationship: payload.relationship,
          isPrimary: payload.isPrimary,
        })
        .where(eq(studentGuardianLinks.id, activeLink.id));

      await this.normalizeStudentPrimaryGuardian(
        tx,
        studentMembership.membershipId,
        payload.isPrimary ? guardianId : undefined,
      );
    });

    return this.getGuardian(institutionId, guardianId, authSession, scopes);
  }

  async unlinkStudent(
    institutionId: string,
    guardianId: string,
    studentId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getGuardianMembership(institutionId, guardianId, activeCampusId);
    const studentMembership = await this.getStudentMembership(
      institutionId,
      studentId,
      activeCampusId,
    );

    await this.db.transaction(async (tx) => {
      const activeLinks = await this.listActiveGuardianLinksForStudent(
        tx,
        studentMembership.membershipId,
      );
      const currentLink = activeLinks.find(
        (link) => link.parentMembershipId === guardianId,
      );

      if (!currentLink) {
        throw new NotFoundException(
          ERROR_MESSAGES.GUARDIANS.STUDENT_LINK_NOT_FOUND,
        );
      }

      if (activeLinks.length === 1) {
        throw new ConflictException(
          ERROR_MESSAGES.GUARDIANS.LAST_GUARDIAN_LINK,
        );
      }

      await tx
        .update(studentGuardianLinks)
        .set({
          deletedAt: new Date(),
          isPrimary: false,
        })
        .where(eq(studentGuardianLinks.id, currentLink.id));

      await this.normalizeStudentPrimaryGuardian(
        tx,
        studentMembership.membershipId,
      );
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITY_TYPES.GUARDIAN,
      entityId: guardianId,
      entityLabel: guardianId,
      summary: `Unlinked student ${studentId} from guardian.`,
    }).catch(() => {});

    return this.getGuardian(institutionId, guardianId, authSession, scopes);
  }

  private async listGuardiansForInstitution(
    institutionId: string,
    activeCampusId: string,
    guardianId?: string,
  ) {
    const guardianRows = await this.db
      .select(this.guardianSelect)
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.GUARDIAN),
          guardianId ? eq(member.id, guardianId) : undefined,
          eq(member.primaryCampusId, activeCampusId),
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );

    const linkedStudentsByGuardian = await this.listLinkedStudentsForGuardians(
      guardianRows.map((row) => row.id),
    );

    return guardianRows.map((row) => ({
      ...row,
      linkedStudents: linkedStudentsByGuardian.get(row.id) ?? [],
    })) satisfies GuardianSummary[];
  }

  private async listLinkedStudentsForGuardians(
    guardianMembershipIds: string[],
  ) {
    if (guardianMembershipIds.length === 0) {
      return new Map<string, GuardianLinkedStudentSummary[]>();
    }

    const linkedStudentRows = await this.db
      .select({
        guardianId: studentGuardianLinks.parentMembershipId,
        studentId: students.id,
        membershipId: students.membershipId,
        firstName: students.firstName,
        lastName: students.lastName,
        admissionNumber: students.admissionNumber,
        campusId: campus.id,
        campusName: campus.name,
        relationship: studentGuardianLinks.relationship,
        isPrimary: studentGuardianLinks.isPrimary,
      })
      .from(studentGuardianLinks)
      .innerJoin(
        students,
        eq(studentGuardianLinks.studentMembershipId, students.membershipId),
      )
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          inArray(
            studentGuardianLinks.parentMembershipId,
            guardianMembershipIds,
          ),
          isNull(studentGuardianLinks.deletedAt),
          ne(member.status, STATUS.MEMBER.DELETED),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      );

    const grouped = new Map<string, GuardianLinkedStudentSummary[]>();

    for (const row of linkedStudentRows) {
      const current = grouped.get(row.guardianId) ?? [];

      current.push({
        studentId: row.studentId,
        membershipId: row.membershipId,
        fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
        admissionNumber: row.admissionNumber,
        campusId: row.campusId,
        campusName: row.campusName,
        relationship: row.relationship,
        isPrimary: row.isPrimary,
      });

      grouped.set(row.guardianId, current);
    }

    return grouped;
  }

  private async getGuardianMembership(
    institutionId: string,
    guardianId: string,
    campusId: string,
  ) {
    const [guardianMembership] = await this.db
      .select({
        id: member.id,
        userId: member.userId,
      })
      .from(member)
      .where(
        and(
          eq(member.id, guardianId),
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.GUARDIAN),
          eq(member.primaryCampusId, campusId),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (!guardianMembership || !guardianMembership.userId) {
      throw new NotFoundException(ERROR_MESSAGES.GUARDIANS.GUARDIAN_NOT_FOUND);
    }

    return {
      id: guardianMembership.id,
      userId: guardianMembership.userId,
    };
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

  private async listActiveGuardianLinksForStudent(
    tx: GuardiansWriter,
    studentMembershipId: string,
  ) {
    return tx
      .select({
        id: studentGuardianLinks.id,
        parentMembershipId: studentGuardianLinks.parentMembershipId,
        isPrimary: studentGuardianLinks.isPrimary,
      })
      .from(studentGuardianLinks)
      .where(
        and(
          eq(studentGuardianLinks.studentMembershipId, studentMembershipId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      ) satisfies Promise<GuardianStudentLinkRecord[]>;
  }

  private async normalizeStudentPrimaryGuardian(
    tx: GuardiansWriter,
    studentMembershipId: string,
    preferredGuardianMembershipId?: string,
  ) {
    const activeLinks = await this.listActiveGuardianLinksForStudent(
      tx,
      studentMembershipId,
    );

    if (activeLinks.length === 0) {
      return;
    }

    const nextPrimaryGuardianId =
      (preferredGuardianMembershipId &&
      activeLinks.some(
        (link) => link.parentMembershipId === preferredGuardianMembershipId,
      )
        ? preferredGuardianMembershipId
        : undefined) ??
      activeLinks.find((link) => link.isPrimary)?.parentMembershipId ??
      activeLinks[0]?.parentMembershipId;

    if (!nextPrimaryGuardianId) {
      return;
    }

    await tx
      .update(studentGuardianLinks)
      .set({ isPrimary: false })
      .where(
        and(
          eq(studentGuardianLinks.studentMembershipId, studentMembershipId),
          isNull(studentGuardianLinks.deletedAt),
        ),
      );

    await tx
      .update(studentGuardianLinks)
      .set({ isPrimary: true })
      .where(
        and(
          eq(studentGuardianLinks.studentMembershipId, studentMembershipId),
          eq(studentGuardianLinks.parentMembershipId, nextPrimaryGuardianId),
          isNull(studentGuardianLinks.deletedAt),
        ),
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
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!matchedCampus) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private async assertGuardianIdentityAvailable(
    institutionId: string,
    currentUserId: string,
    mobile: string,
    email: string | null,
  ) {
    const [matchedMobileUser] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(
        and(eq(user.mobile, mobile), eq(user.institutionId, institutionId)),
      )
      .limit(1);

    if (matchedMobileUser && matchedMobileUser.id !== currentUserId) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.MOBILE_ALREADY_EXISTS);
    }

    if (!email) {
      return;
    }

    const [matchedEmailUser] = await this.db
      .select({ id: user.id })
      .from(user)
      .where(and(eq(user.email, email), eq(user.institutionId, institutionId)))
      .limit(1);

    if (matchedEmailUser && matchedEmailUser.id !== currentUserId) {
      throw new ConflictException(ERROR_MESSAGES.AUTH.EMAIL_ALREADY_EXISTS);
    }
  }

  private async findGuardianMembershipByIdentity(
    institutionId: string,
    mobile: string,
    email: string | null,
  ) {
    const conditions = [
      eq(member.organizationId, institutionId),
      eq(member.memberType, MEMBER_TYPES.GUARDIAN),
      ne(member.status, STATUS.MEMBER.DELETED),
      or(eq(user.mobile, mobile), email ? eq(user.email, email) : undefined),
    ].filter(Boolean);

    const [matchedGuardian] = await this.db
      .select({
        id: member.id,
        userId: user.id,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .where(and(...conditions))
      .limit(1);

    return matchedGuardian ?? null;
  }

  private async ensureCampusMembership(
    tx: GuardiansWriter,
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

  private readonly guardianSelect = {
    id: member.id,
    userId: user.id,
    institutionId: member.organizationId,
    name: user.name,
    mobile: user.mobile,
    email: user.email,
    campusId: campus.id,
    campusName: campus.name,
    status: member.status,
  };

  private requireActiveCampusId(authSession: AuthenticatedSession) {
    if (!authSession.activeCampusId) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }

    return authSession.activeCampusId;
  }

  private assertCampusScopeAccess(campusId: string, scopes: ResolvedScopes) {
    if (scopes.campusIds === "all") {
      return;
    }

    if (!scopes.campusIds.includes(campusId)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.CAMPUS_ACCESS_REQUIRED);
    }
  }

  async resetMemberPassword(
    institutionId: string,
    guardianId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ): Promise<void> {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const guardianMembership = await this.getGuardianMembership(
      institutionId,
      guardianId,
      activeCampusId,
    );

    await this.authService.adminResetMemberPassword(
      guardianMembership.userId,
      institutionId,
    );
  }
}
