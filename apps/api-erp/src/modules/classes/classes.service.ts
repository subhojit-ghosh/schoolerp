import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import { campus, classSections, schoolClasses, students } from "@repo/database";
import { and, asc, eq, inArray, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES } from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedSession } from "../auth/auth.types";
import type {
  CreateClassDto,
  SetClassStatusDto,
  UpdateClassDto,
} from "./classes.schemas";

@Injectable()
export class ClassesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listClasses(
    institutionId: string,
    authSession: AuthenticatedSession,
    campusId?: string,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const scopedCampusId = campusId ?? authSession.activeCampusId ?? undefined;

    if (scopedCampusId) {
      await this.getCampus(institutionId, scopedCampusId);
    }

    return this.listClassesForInstitution(
      institutionId,
      undefined,
      scopedCampusId,
    );
  }

  async getClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const [classRecord] = await this.listClassesForInstitution(
      institutionId,
      classId,
    );

    if (!classRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return classRecord;
  }

  async createClass(
    institutionId: string,
    authSession: AuthenticatedSession,
    payload: CreateClassDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
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
        })),
      );
    });

    return this.getClass(institutionId, createdClassId, authSession);
  }

  async updateClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    payload: UpdateClassDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);

    await this.getClassOrThrow(institutionId, classId);
    const selectedCampus = await this.getCampus(
      institutionId,
      payload.campusId,
    );
    await this.assertClassNameAvailable(
      institutionId,
      selectedCampus.id,
      payload.name,
      classId,
    );

    await this.db.transaction(async (tx) => {
      await tx
        .update(schoolClasses)
        .set({
          campusId: selectedCampus.id,
          name: payload.name.trim(),
        })
        .where(eq(schoolClasses.id, classId));

      const activeSections = await tx
        .select({
          id: classSections.id,
        })
        .from(classSections)
        .where(
          and(
            eq(classSections.classId, classId),
            isNull(classSections.deletedAt),
          ),
        );

      const activeSectionIds = new Set(
        activeSections.map((section) => section.id),
      );
      const nextSectionIds = new Set<string>();

      for (const [index, section] of payload.sections.entries()) {
        if (section.id) {
          if (!activeSectionIds.has(section.id)) {
            throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
          }

          nextSectionIds.add(section.id);

          await tx
            .update(classSections)
            .set({
              name: section.name.trim(),
              displayOrder: index,
              deletedAt: null,
            })
            .where(eq(classSections.id, section.id));

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
        });
      }

      const removedSectionIds = activeSections
        .map((section) => section.id)
        .filter((sectionId) => !nextSectionIds.has(sectionId));

      if (removedSectionIds.length > 0) {
        await tx
          .update(classSections)
          .set({
            deletedAt: new Date(),
          })
          .where(inArray(classSections.id, removedSectionIds));
      }
    });

    return this.getClass(institutionId, classId, authSession);
  }

  async setClassStatus(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
    payload: SetClassStatusDto,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);
    await this.getClassOrThrow(institutionId, classId);

    await this.db
      .update(schoolClasses)
      .set({ isActive: payload.isActive })
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
        ),
      );

    return this.getClass(institutionId, classId, authSession);
  }

  async deleteClass(
    institutionId: string,
    classId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, institutionId);
    await this.getClassOrThrow(institutionId, classId);

    const [enrolledStudent] = await this.db
      .select({ id: students.id })
      .from(students)
      .where(
        and(
          eq(students.classId, classId),
          eq(students.institutionId, institutionId),
          isNull(students.deletedAt),
        ),
      )
      .limit(1);

    if (enrolledStudent) {
      throw new ConflictException(ERROR_MESSAGES.CLASSES.CLASS_HAS_STUDENTS);
    }

    await this.db
      .update(schoolClasses)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
        ),
      );
  }

  private async listClassesForInstitution(
    institutionId: string,
    classId?: string,
    campusId?: string,
  ) {
    const classRows = await this.db
      .select({
        id: schoolClasses.id,
        institutionId: schoolClasses.institutionId,
        campusId: schoolClasses.campusId,
        campusName: campus.name,
        name: schoolClasses.name,
        isActive: schoolClasses.isActive,
        displayOrder: schoolClasses.displayOrder,
      })
      .from(schoolClasses)
      .innerJoin(campus, eq(schoolClasses.campusId, campus.id))
      .where(
        and(
          eq(schoolClasses.institutionId, institutionId),
          classId ? eq(schoolClasses.id, classId) : undefined,
          campusId ? eq(schoolClasses.campusId, campusId) : undefined,
          isNull(schoolClasses.deletedAt),
          isNull(campus.deletedAt),
        ),
      )
      .orderBy(asc(schoolClasses.displayOrder), asc(schoolClasses.name));

    const sectionsByClassId = await this.listSectionsForClassIds(
      classRows.map((row) => row.id),
    );

    return classRows.map((row) => ({
      ...row,
      sections: sectionsByClassId.get(row.id) ?? [],
    }));
  }

  private async listSectionsForClassIds(classIds: string[]) {
    const sectionsByClassId = new Map<
      string,
      Array<{
        id: string;
        classId: string;
        name: string;
        displayOrder: number;
      }>
    >();

    if (classIds.length === 0) {
      return sectionsByClassId;
    }

    const sectionRows = await this.db
      .select({
        id: classSections.id,
        classId: classSections.classId,
        name: classSections.name,
        displayOrder: classSections.displayOrder,
      })
      .from(classSections)
      .where(
        and(
          inArray(classSections.classId, classIds),
          isNull(classSections.deletedAt),
        ),
      )
      .orderBy(asc(classSections.displayOrder), asc(classSections.name));

    for (const section of sectionRows) {
      const currentSections = sectionsByClassId.get(section.classId) ?? [];
      currentSections.push(section);
      sectionsByClassId.set(section.classId, currentSections);
    }

    return sectionsByClassId;
  }

  private async getClassOrThrow(institutionId: string, classId: string) {
    const [classRecord] = await this.db
      .select({
        id: schoolClasses.id,
      })
      .from(schoolClasses)
      .where(
        and(
          eq(schoolClasses.id, classId),
          eq(schoolClasses.institutionId, institutionId),
          isNull(schoolClasses.deletedAt),
        ),
      )
      .limit(1);

    if (!classRecord) {
      throw new NotFoundException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return classRecord;
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
          isNull(campus.deletedAt),
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
          isNull(schoolClasses.deletedAt),
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
          isNull(schoolClasses.deletedAt),
        ),
      )
      .orderBy(asc(schoolClasses.displayOrder));

    return classRows.length;
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
