import { ConflictException } from "@nestjs/common";
import { describe, expect, mock, test } from "bun:test";
import {
  classSections,
  studentCurrentEnrollments,
  students,
} from "@repo/database";
import { ERROR_MESSAGES } from "../../constants";
import { ClassesService } from "./classes.service";

function setPrivateMethod(instance: object, name: string, value: unknown) {
  Reflect.set(instance, name, value);
}

function createSelectExecutor(
  responses: Map<unknown, unknown[]>,
  fallback: unknown[] = [],
) {
  return mock(() => ({
    from: mock((table: unknown) => ({
      where: mock(() => {
        const rows = responses.get(table) ?? fallback;
        const result = Promise.resolve(rows);

        return Object.assign(result, {
          limit: mock(() => Promise.resolve(rows)),
        });
      }),
    })),
  }));
}

function createClassesService() {
  const txInsertValues = mock(() => Promise.resolve(undefined));
  const tx = {
    select: createSelectExecutor(new Map()),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => Promise.resolve(undefined)),
      })),
    })),
    insert: mock(() => ({
      values: txInsertValues,
    })),
  };

  const db = {
    select: createSelectExecutor(new Map()),
    update: mock(() => ({
      set: mock(() => ({
        where: mock(() => Promise.resolve(undefined)),
      })),
    })),
    transaction: mock(async (callback: (txArg: typeof tx) => Promise<unknown>) =>
      callback(tx),
    ),
  };

  const authService = {
    requireOrganizationContext: mock(() => Promise.resolve(undefined)),
  };

  return {
    db,
    tx,
    txInsertValues,
    service: new ClassesService(db as never, authService as never),
  };
}

describe("ClassesService", () => {
  test("blocks removing a section when active students still belong to it", async () => {
    const { service, tx } = createClassesService();

    setPrivateMethod(service, "getClassOrThrow", () =>
      Promise.resolve({ id: "class-1" }),
    );
    setPrivateMethod(service, "getCampus", () =>
      Promise.resolve({ id: "campus-1" }),
    );
    setPrivateMethod(service, "assertClassNameAvailable", () =>
      Promise.resolve(undefined),
    );

    tx.select = createSelectExecutor(
      new Map<unknown, unknown[]>([
        [
          classSections,
          [
            { id: "section-1", name: "A", isActive: true, deletedAt: null },
            { id: "section-2", name: "B", isActive: true, deletedAt: null },
          ],
        ],
        [students, [{ id: "student-1" }]],
      ]),
    );

    try {
      await service.updateClass(
        "institution-1",
        "class-1",
        {} as never,
        {
          campusId: "campus-1",
          name: "Class 1",
          sections: [{ id: "section-1", name: "A" }],
        },
      );
      throw new Error("Expected section removal to be blocked");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.CLASSES.SECTION_HAS_STUDENTS,
      );
    }
  });

  test("blocks deleting a class when current enrollments still reference it", async () => {
    const { db, service } = createClassesService();

    setPrivateMethod(service, "getClassOrThrow", () =>
      Promise.resolve({ id: "class-1" }),
    );

    db.select = createSelectExecutor(
      new Map<unknown, unknown[]>([
        [students, []],
        [studentCurrentEnrollments, [{ id: "enrollment-1" }]],
      ]),
    );

    try {
      await service.deleteClass("institution-1", "class-1", {} as never);
      throw new Error("Expected class deletion to be blocked");
    } catch (error) {
      expect(error).toBeInstanceOf(ConflictException);
      expect(error).toHaveProperty(
        "message",
        ERROR_MESSAGES.CLASSES.CLASS_HAS_CURRENT_ENROLLMENTS,
      );
    }
  });

  test("revives a soft-deleted section instead of inserting a duplicate name", async () => {
    const { service, tx, txInsertValues } = createClassesService();

    setPrivateMethod(service, "getClassOrThrow", () =>
      Promise.resolve({ id: "class-1" }),
    );
    setPrivateMethod(service, "getCampus", () =>
      Promise.resolve({ id: "campus-1" }),
    );
    setPrivateMethod(service, "assertClassNameAvailable", () =>
      Promise.resolve(undefined),
    );
    setPrivateMethod(service, "getClass", () =>
      Promise.resolve({ id: "class-1" }),
    );

    tx.select = createSelectExecutor(
      new Map<unknown, unknown[]>([
        [
          classSections,
          [
            {
              id: "section-a-old",
              name: "A",
              isActive: false,
              deletedAt: new Date(),
            },
            { id: "section-b", name: "B", isActive: true, deletedAt: null },
          ],
        ],
      ]),
    );

    const result = await service.updateClass(
      "institution-1",
      "class-1",
      {} as never,
      {
        campusId: "campus-1",
        name: "Class 1",
        sections: [
          { id: "section-b", name: "B" },
          { name: "A" },
        ],
      },
    );

    expect(result).toMatchObject({ id: "class-1" });
    expect(txInsertValues).not.toHaveBeenCalled();
  });

  test("includes previously soft-deleted sections in archived class detail", async () => {
    const { db, service } = createClassesService();

    db.select = createSelectExecutor(
      new Map<unknown, unknown[]>([
        [
          classSections,
          [
            {
              id: "section-a-old",
              classId: "class-1",
              name: "A",
              isActive: false,
              displayOrder: 0,
              deletedAt: new Date(),
            },
            {
              id: "section-b",
              classId: "class-1",
              name: "B",
              isActive: true,
              displayOrder: 1,
              deletedAt: null,
            },
          ],
        ],
      ]),
    );

    setPrivateMethod(service, "listClassesForInstitution", () =>
      Promise.resolve([
        {
          id: "class-1",
          institutionId: "institution-1",
          campusId: "campus-1",
          campusName: "Main",
          name: "Class 1",
          isActive: true,
          displayOrder: 0,
          sections: [
            {
              id: "section-b",
              classId: "class-1",
              name: "B",
              displayOrder: 1,
            },
          ],
          archivedSections: [{ id: "section-a-old", name: "A" }],
        },
      ]),
    );

    const result = await service.getClass("institution-1", "class-1", {} as never);

    expect(result.archivedSections).toEqual([{ id: "section-a-old", name: "A" }]);
  });
});
