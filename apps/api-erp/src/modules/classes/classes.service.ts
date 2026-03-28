import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
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
  classSections,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  member,
  ne,
  schoolClasses,
  studentCurrentEnrollments,
  students,
  user,
  type SQL,
} from "@repo/database";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, SORT_ORDERS, STATUS } from "../../constants";
import { resolvePagination, resolveTablePageSize } from "../../lib/list-query";
import { AuditService } from "../audit/audit.service";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import type {
  CreateClassDto,
  ListClassesQueryDto,
  SetClassStatusDto,
  UpdateClassDto,
} from "./classes.schemas";
import { sortableClassColumns } from "./classes.schemas";

const sortableColumns = {
  campus: campus.name,
  name: schoolClasses.name,
  status: schoolClasses.status,
} as const;

type ClassesSelectExecutor = Pick<AppDatabase, "select">;

function normalizeSectionName(name: string) {
  return name.trim().toLowerCase();
}

@Injectable()
export class ClassesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listClasses(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    query: ListClassesQueryDto = {},
  ) {
    const scopedCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(scopedCampusId, scopes);
    await this.getCampus(institutionId, scopedCampusId);

    const pageSize = resolveTablePageSize(query.limit);
    const sortKey = query.sort ?? sortableClassColumns.name;
    const sortDirection = query.order === SORT_ORDERS.DESC ? desc : asc;
    const conditions: SQL[] = [
      eq(schoolClasses.institutionId, institutionId),
      ne(schoolClasses.status, STATUS.CLASS.DELETED),
    ];

    conditions.push(eq(schoolClasses.campusId, scopedCampusId));

    if (query.search) {
      conditions.push(ilike(schoolClasses.name, `%${query.search}%`));
    }

    const where = and(...conditions)!;
    const [totalRow] = await this.db
      .select({ count: count() })
      .from(schoolClasses)
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(where);

    const total = totalRow?.count ?? 0;
    const pagination = resolvePagination(total, query.page, pageSize);

    const classRows = await this.db
      .select({
        id: schoolClasses.id,
        institutionId: schoolClasses.institutionId,
        campusId: schoolClasses.campusId,
        campusName: campus.name,
        name: schoolClasses.name,
        status: schoolClasses.status,
        displayOrder: schoolClasses.displayOrder,
      })
      .from(schoolClasses)
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(where)
      .orderBy(
        sortDirection(sortableColumns[sortKey]),
        asc(schoolClasses.displayOrder),
        asc(schoolClasses.name),
      )
      .limit(pageSize)
      .offset(pagination.offset);

    const sectionsByClassId = await this.listSectionsForClassIds(
      classRows.map((row) => row.id),
    );

    return {
      rows: classRows.map((row) => ({
        ...row,
        sections: sectionsByClassId.get(row.id)?.active ?? [],
      })),
      total,
      page: pagination.page,
      pageSize,
      pageCount: pagination.pageCount,
    };
  }

  async getClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);

    const [classRecord] = await this.listClassesForInstitution(
      institutionId,
      classId,
      activeCampusId,
      true,
    );

    if (!classRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return classRecord;
  }

  async createClass(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: CreateClassDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const selectedCampus = await this.getCampus(institutionId, activeCampusId);
    await this.assertClassNameAvailable(
      institutionId,
      selectedCampus.id,
      payload.name,
    );

    const createdClassId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(schoolClasses).values({
        id: createdClassId,
        institutionId,
        campusId: selectedCampus.id,
        name: payload.name.trim(),
        displayOrder: await this.getNextClassDisplayOrder(tx, institutionId),
      });

      await tx.insert(classSections).values(
        payload.sections.map((section, index) => ({
          id: randomUUID(),
          institutionId,
          classId: createdClassId,
          name: section.name.trim(),
          displayOrder: index,
          classTeacherMembershipId: section.classTeacherMembershipId ?? null,
        })),
      );
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.CREATE,
      entityType: AUDIT_ENTITY_TYPES.CLASS,
      entityId: createdClassId,
      entityLabel: payload.name.trim(),
      summary: `Created class ${payload.name.trim()}.`,
    }).catch(() => {});

    return this.getClass(institutionId, createdClassId, authSession, scopes);
  }

  async updateClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: UpdateClassDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    const existingClass = await this.getClassOrThrow(
      institutionId,
      classId,
      activeCampusId,
    );
    await this.assertClassNameAvailable(
      institutionId,
      existingClass.campusId,
      payload.name,
      classId,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(schoolClasses)
        .set({
          name: payload.name.trim(),
        })
        .where(eq(schoolClasses.id, classId));

      const existingSections = await tx
        .select({
          id: classSections.id,
          name: classSections.name,
          status: classSections.status,
        })
        .from(classSections)
        .where(eq(classSections.classId, classId));

      const existingSectionsById = new Map(
        existingSections.map((section) => [section.id, section]),
      );
      const nextSectionIds = new Set<string>();

      for (const [index, section] of payload.sections.entries()) {
        const normalizedSectionName = normalizeSectionName(section.name);

        if (section.id) {
          const existingSection = existingSectionsById.get(section.id);

          if (!existingSection) {
            throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
          }

          nextSectionIds.add(section.id);

          await tx
            .update(classSections)
            .set({
              name: section.name.trim(),
              status: STATUS.SECTION.ACTIVE,
              displayOrder: index,
              classTeacherMembershipId:
                section.classTeacherMembershipId ?? null,
            })
            .where(eq(classSections.id, section.id));

          continue;
        }

        const matchingInactiveSection = existingSections.find(
          (existingSection) =>
            existingSection.status !== STATUS.SECTION.ACTIVE &&
            !nextSectionIds.has(existingSection.id) &&
            normalizeSectionName(existingSection.name) ===
              normalizedSectionName,
        );

        if (matchingInactiveSection) {
          nextSectionIds.add(matchingInactiveSection.id);

          await tx
            .update(classSections)
            .set({
              name: section.name.trim(),
              status: STATUS.SECTION.ACTIVE,
              displayOrder: index,
              classTeacherMembershipId:
                section.classTeacherMembershipId ?? null,
            })
            .where(eq(classSections.id, matchingInactiveSection.id));

          continue;
        }

        const nextSectionId = randomUUID();
        nextSectionIds.add(nextSectionId);
        await tx.insert(classSections).values({
          id: nextSectionId,
          institutionId,
          classId,
          name: section.name.trim(),
          displayOrder: index,
          classTeacherMembershipId: section.classTeacherMembershipId ?? null,
        });
      }

      const removedSectionIds = existingSections
        .filter((section) => section.status === STATUS.SECTION.ACTIVE)
        .map((section) => section.id)
        .filter((sectionId) => !nextSectionIds.has(sectionId));

      if (removedSectionIds.length > 0) {
        await this.assertSectionsRemovable(
          tx,
          institutionId,
          removedSectionIds,
        );

        await tx
          .update(classSections)
          .set({ status: STATUS.SECTION.INACTIVE })
          .where(inArray(classSections.id, removedSectionIds));
      }
    });

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.UPDATE,
      entityType: AUDIT_ENTITY_TYPES.CLASS,
      entityId: classId,
      entityLabel: payload.name.trim(),
      summary: `Updated class ${payload.name.trim()}.`,
    }).catch(() => {});

    return this.getClass(institutionId, classId, authSession, scopes);
  }

  async setClassStatus(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: SetClassStatusDto,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getClassOrThrow(institutionId, classId, activeCampusId);

    await this.db
      .update(schoolClasses)
      .set({ status: payload.status })
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
        ),
      );

    return this.getClass(institutionId, classId, authSession, scopes);
  }

  async deleteClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
  ) {
    const activeCampusId = this.requireActiveCampusId(authSession);
    this.assertCampusScopeAccess(activeCampusId, scopes);
    await this.getClassOrThrow(institutionId, classId, activeCampusId);

    await this.assertClassRemovable(institutionId, classId);

    await this.db
      .update(schoolClasses)
      .set({ status: STATUS.CLASS.DELETED, deletedAt: new Date() })
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
        ),
      );

    this.auditService.record({
      institutionId,
      authSession,
      action: AUDIT_ACTIONS.DELETE,
      entityType: AUDIT_ENTITY_TYPES.CLASS,
      entityId: classId,
      entityLabel: classId,
      summary: `Deleted class ${classId}.`,
    }).catch(() => {});
  }

  private async listClassesForInstitution(
    institutionId: string,
    classId?: string,
    campusId?: string,
    includeArchivedSections = false,
  ) {
    const classRows = await this.db
      .select({
        id: schoolClasses.id,
        institutionId: schoolClasses.institutionId,
        campusId: schoolClasses.campusId,
        campusName: campus.name,
        name: schoolClasses.name,
        status: schoolClasses.status,
        displayOrder: schoolClasses.displayOrder,
      })
      .from(schoolClasses)
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          classId ? eq(schoolClasses.id, classId) : undefined,
          campusId ? eq(schoolClasses.campusId, campusId) : undefined,
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .orderBy(asc(schoolClasses.displayOrder), asc(schoolClasses.name));

    const sectionsByClassId = await this.listSectionsForClassIds(
      classRows.map((row) => row.id),
      includeArchivedSections,
    );

    return classRows.map((row) => ({
      ...row,
      sections: sectionsByClassId.get(row.id)?.active ?? [],
      archivedSections: sectionsByClassId.get(row.id)?.archived ?? [],
    }));
  }

  private async listSectionsForClassIds(
    classIds: string[],
    includeArchivedSections = false,
  ) {
    const sectionsByClassId = new Map<
      string,
      {
        active: Array<{
          id: string;
          classId: string;
          name: string;
          displayOrder: number;
          classTeacherMembershipId: string | null;
          classTeacherName: string | null;
        }>;
        archived: Array<{
          id: string;
          name: string;
        }>;
      }
    >();

    if (classIds.length === 0) {
      return sectionsByClassId;
    }

    const classTeacherMember = member;
    const classTeacherUser = user;

    const sectionRows = await this.db
      .select({
        id: classSections.id,
        classId: classSections.classId,
        name: classSections.name,
        status: classSections.status,
        displayOrder: classSections.displayOrder,
        classTeacherMembershipId: classSections.classTeacherMembershipId,
        classTeacherName: classTeacherUser.name,
      })
      .from(classSections)
      .leftJoin(
        classTeacherMember,
        eq(classSections.classTeacherMembershipId, classTeacherMember.id),
      )
      .leftJoin(
        classTeacherUser,
        eq(classTeacherMember.userId, classTeacherUser.id),
      )
      .where(and(inArray(classSections.classId, classIds)))
      .orderBy(asc(classSections.displayOrder), asc(classSections.name));

    for (const section of sectionRows) {
      const currentSections = sectionsByClassId.get(section.classId) ?? {
        active: [],
        archived: [],
      };

      if (section.status === STATUS.SECTION.ACTIVE) {
        currentSections.active.push({
          id: section.id,
          classId: section.classId,
          name: section.name,
          displayOrder: section.displayOrder,
          classTeacherMembershipId: section.classTeacherMembershipId,
          classTeacherName: section.classTeacherName,
        });
      } else if (includeArchivedSections) {
        currentSections.archived.push({
          id: section.id,
          name: section.name,
        });
      }

      sectionsByClassId.set(section.classId, currentSections);
    }

    return sectionsByClassId;
  }

  private async getClassOrThrow(
    institutionId: string,
    classId: string,
    campusId: string,
  ) {
    const [classRecord] = await this.db
      .select({
        id: schoolClasses.id,
        campusId: schoolClasses.campusId,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
          eq(schoolClasses.campusId, campusId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .limit(1);

    if (!classRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return classRecord;
  }

  private async assertClassRemovable(institutionId: string, classId: string) {
    const [enrolledStudent] = await this.db
      .select({ id: students.id })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.classId, classId),
          eq(students.institutionId, institutionId),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (enrolledStudent) {
      throw new ConflictException(ERROR_MESSAGES.CLASSES.CLASS_HAS_STUDENTS);
    }

    const [currentEnrollment] = await this.db
      .select({ id: studentCurrentEnrollments.id })
      .from(studentCurrentEnrollments)
      .where(
        and(
          eq(studentCurrentEnrollments.classId, classId),
          eq(studentCurrentEnrollments.institutionId, institutionId),
          isNull(studentCurrentEnrollments.deletedAt),
        ),
      )
      .limit(1);

    if (currentEnrollment) {
      throw new ConflictException(
        ERROR_MESSAGES.CLASSES.CLASS_HAS_CURRENT_ENROLLMENTS,
      );
    }
  }

  private async assertSectionsRemovable(
    db: ClassesSelectExecutor,
    institutionId: string,
    sectionIds: string[],
  ) {
    const [enrolledStudent] = await db
      .select({ id: students.id })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .where(
        and(
          eq(students.institutionId, institutionId),
          inArray(students.sectionId, sectionIds),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    if (enrolledStudent) {
      throw new ConflictException(ERROR_MESSAGES.CLASSES.SECTION_HAS_STUDENTS);
    }

    const [currentEnrollment] = await db
      .select({ id: studentCurrentEnrollments.id })
      .from(studentCurrentEnrollments)
      .where(
        and(
          eq(studentCurrentEnrollments.institutionId, institutionId),
          inArray(studentCurrentEnrollments.sectionId, sectionIds),
          isNull(studentCurrentEnrollments.deletedAt),
        ),
      )
      .limit(1);

    if (currentEnrollment) {
      throw new ConflictException(
        ERROR_MESSAGES.CLASSES.SECTION_HAS_CURRENT_ENROLLMENTS,
      );
    }
  }

  private async getCampus(institutionId: string, campusId: string) {
    const [campusRecord] = await this.db
      .select({
        id: campus.id,
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

    if (!campusRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return campusRecord;
  }

  private async assertClassNameAvailable(
    institutionId: string,
    campusId: string,
    name: string,
    classIdToIgnore?: string,
  ) {
    const [existingClass] = await this.db
      .select({
        id: schoolClasses.id,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          eq(schoolClasses.campusId, campusId),
          eq(schoolClasses.name, name.trim()),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .limit(1);

    if (existingClass && existingClass.id !== classIdToIgnore) {
      throw new ConflictException(ERROR_MESSAGES.CLASSES.CLASS_NAME_EXISTS);
    }
  }

  private async getNextClassDisplayOrder(
    tx: Pick<AppDatabase, "select">,
    institutionId: string,
  ) {
    const classRows = await tx
      .select({
        displayOrder: schoolClasses.displayOrder,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          ne(schoolClasses.status, STATUS.CLASS.DELETED),
        ),
      )
      .orderBy(asc(schoolClasses.displayOrder));

    return classRows.length;
  }

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
}
