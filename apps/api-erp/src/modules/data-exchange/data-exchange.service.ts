import {
  DATA_EXCHANGE_ACTIONS,
  DATA_EXCHANGE_ENTITY_TYPES,
  FEE_STRUCTURE_SCOPES,
  GUARDIAN_RELATIONSHIPS,
  type DataExchangeAction,
  type DataExchangeEntityType,
  type GuardianRelationship,
} from "@repo/contracts";
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
} from "@nestjs/common";
import { DATABASE } from "@repo/backend-core";
import type { AppDatabase } from "@repo/database";
import {
  academicYears,
  and,
  asc,
  campus,
  classSections,
  desc,
  eq,
  feeAssignments,
  feeStructures,
  inArray,
  isNull,
  member,
  ne,
  schoolClasses,
  studentCurrentEnrollments,
  studentGuardianLinks,
  students,
  user,
} from "@repo/database";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  PERMISSIONS,
  STATUS,
  type PermissionSlug,
} from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { AuthenticatedSession, ResolvedScopes } from "../auth/auth.types";
import { campusScopeFilter, sectionScopeFilter } from "../auth/scope-filter";
import { FeesService } from "../fees/fees.service";
import { GuardiansService } from "../guardians/guardians.service";
import { StaffService } from "../staff/staff.service";
import { StudentsService } from "../students/students.service";
import type { DataExchangeBodyDto } from "./data-exchange.schemas";
import {
  buildTemplateCsv,
  DATA_EXCHANGE_HEADERS,
  GUARDIAN_COLUMN_COUNT,
  parseCsv,
  stringifyCsv,
} from "./data-exchange.csv";

type RowResult = {
  rowNumber: number;
  identifier: string;
  status: "valid" | "error" | "imported" | "failed";
  messages: string[];
};

type StudentImportPayload = {
  admissionNumber: string;
  firstName: string;
  lastName?: string;
  campusId: string;
  classId: string;
  sectionId: string;
  customFieldValues?: Record<string, unknown>;
  currentEnrollment: {
    academicYearId: string;
    classId: string;
    sectionId: string;
  } | null;
  guardians: Array<{
    name: string;
    mobile: string;
    email: string | undefined;
    relationship: GuardianRelationship;
    isPrimary: boolean;
  }>;
};

type StaffImportPayload = {
  name: string;
  mobile: string;
  email: string | undefined;
  campusId: string;
  status: "active" | "inactive" | "suspended";
};

type GuardianImportPayload = {
  name: string;
  mobile: string;
  email: string | undefined;
  campusId: string;
  studentId: string;
  relationship: GuardianRelationship;
  isPrimary: boolean;
};

type FeeAssignmentImportPayload = {
  feeStructureId: string;
  studentId: string;
  notes: string | undefined;
};

type PreviewContext = {
  campusByName: Map<string, { id: string; name: string }>;
  academicYearByName: Map<
    string,
    { id: string; name: string; isCurrent: boolean }
  >;
  studentByAdmissionNumber: Map<
    string,
    { id: string; admissionNumber: string; campusId: string }
  >;
  classByKey: Map<string, { id: string; campusId: string; name: string }>;
  sectionByKey: Map<string, { id: string; classId: string; name: string }>;
  feeStructureByKey: Map<
    string,
    {
      id: string;
      name: string;
      academicYearId: string;
      campusId: string | null;
      scope: string;
    }
  >;
  existingStudentAdmissions: Set<string>;
};

const ENTITY_ACTION_PERMISSIONS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: {
    [DATA_EXCHANGE_ACTIONS.IMPORT]: PERMISSIONS.STUDENTS_MANAGE,
    [DATA_EXCHANGE_ACTIONS.EXPORT]: PERMISSIONS.STUDENTS_READ,
  },
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: {
    [DATA_EXCHANGE_ACTIONS.IMPORT]: PERMISSIONS.STAFF_MANAGE,
    [DATA_EXCHANGE_ACTIONS.EXPORT]: PERMISSIONS.STAFF_READ,
  },
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: {
    [DATA_EXCHANGE_ACTIONS.IMPORT]: PERMISSIONS.GUARDIANS_MANAGE,
    [DATA_EXCHANGE_ACTIONS.EXPORT]: PERMISSIONS.GUARDIANS_READ,
  },
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: {
    [DATA_EXCHANGE_ACTIONS.IMPORT]: PERMISSIONS.FEES_MANAGE,
    [DATA_EXCHANGE_ACTIONS.EXPORT]: PERMISSIONS.FEES_READ,
  },
} as const satisfies Record<
  DataExchangeEntityType,
  Record<DataExchangeAction, PermissionSlug>
>;

const BOOLEAN_TRUE_VALUES = new Set(["true", "yes", "1"]);
const BOOLEAN_FALSE_VALUES = new Set(["false", "no", "0", ""]);

@Injectable()
export class DataExchangeService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
    private readonly studentsService: StudentsService,
    private readonly staffService: StaffService,
    private readonly guardiansService: GuardiansService,
    private readonly feesService: FeesService,
  ) {}

  async getCapabilities(
    institutionId: string,
    authSession: AuthenticatedSession,
  ) {
    const permissions = await this.resolvePermissions(
      authSession,
      institutionId,
    );

    return {
      entities: Object.values(DATA_EXCHANGE_ENTITY_TYPES)
        .map((entityType) => ({
          entityType,
          actions: Object.values(DATA_EXCHANGE_ACTIONS).filter((action) =>
            permissions.has(ENTITY_ACTION_PERMISSIONS[entityType][action]),
          ),
        }))
        .filter((entity) => entity.actions.length > 0),
    };
  }

  async getTemplate(
    institutionId: string,
    authSession: AuthenticatedSession,
    entityType: DataExchangeEntityType,
  ) {
    await this.assertPermission(
      institutionId,
      authSession,
      entityType,
      DATA_EXCHANGE_ACTIONS.EXPORT,
    );

    return {
      fileName: `${entityType}-template.csv`,
      content: buildTemplateCsv(entityType),
    };
  }

  async previewImport(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: DataExchangeBodyDto,
  ) {
    await this.assertPermission(
      institutionId,
      authSession,
      payload.entityType,
      DATA_EXCHANGE_ACTIONS.IMPORT,
    );

    const context = await this.buildPreviewContext(institutionId, scopes);
    const rows = this.parseCsvRows(payload.entityType, payload.csvContent);
    const previewRows = await Promise.all(
      rows.map((row, index) =>
        this.previewRow(
          institutionId,
          payload.entityType,
          context,
          row,
          index + 2,
        ),
      ),
    );

    return {
      entityType: payload.entityType,
      summary: {
        totalRows: previewRows.length,
        validRows: previewRows.filter((row) => row.status === "valid").length,
        invalidRows: previewRows.filter((row) => row.status === "error").length,
      },
      rows: previewRows,
    };
  }

  async executeImport(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    payload: DataExchangeBodyDto,
  ) {
    await this.assertPermission(
      institutionId,
      authSession,
      payload.entityType,
      DATA_EXCHANGE_ACTIONS.IMPORT,
    );

    const context = await this.buildPreviewContext(institutionId, scopes);
    const rows = this.parseCsvRows(payload.entityType, payload.csvContent);
    const results: RowResult[] = [];

    for (const [index, row] of rows.entries()) {
      const rowNumber = index + 2;
      const preview = await this.previewRow(
        institutionId,
        payload.entityType,
        context,
        row,
        rowNumber,
      );

      if (preview.status === "error") {
        results.push({ ...preview, status: "failed" });
        continue;
      }

      try {
        await this.executeRow(
          institutionId,
          authSession,
          scopes,
          payload.entityType,
          row,
          context,
        );

        results.push({
          rowNumber,
          identifier: preview.identifier,
          status: "imported",
          messages: ["Imported successfully."],
        });
      } catch (error) {
        results.push({
          rowNumber,
          identifier: preview.identifier,
          status: "failed",
          messages: [this.toErrorMessage(error)],
        });
      }
    }

    return {
      entityType: payload.entityType,
      summary: {
        totalRows: results.length,
        importedRows: results.filter((row) => row.status === "imported").length,
        failedRows: results.filter((row) => row.status === "failed").length,
      },
      rows: results,
    };
  }

  async exportData(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    entityType: DataExchangeEntityType,
  ) {
    await this.assertPermission(
      institutionId,
      authSession,
      entityType,
      DATA_EXCHANGE_ACTIONS.EXPORT,
    );

    const rows =
      entityType === DATA_EXCHANGE_ENTITY_TYPES.STUDENTS
        ? await this.exportStudents(institutionId, scopes)
        : entityType === DATA_EXCHANGE_ENTITY_TYPES.STAFF
          ? await this.exportStaff(institutionId, scopes)
          : entityType === DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS
            ? await this.exportGuardians(institutionId, scopes)
            : await this.exportFeeAssignments(institutionId, scopes);

    return {
      fileName: `${entityType}-export.csv`,
      content: stringifyCsv([[...DATA_EXCHANGE_HEADERS[entityType]], ...rows]),
    };
  }

  private async executeRow(
    institutionId: string,
    authSession: AuthenticatedSession,
    scopes: ResolvedScopes,
    entityType: DataExchangeEntityType,
    row: Record<string, string>,
    context: PreviewContext,
  ) {
    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STUDENTS) {
      const payload = this.resolveStudentPayload(row, context);
      await this.studentsService.createStudent(
        institutionId,
        authSession,
        scopes,
        payload,
      );
      context.existingStudentAdmissions.add(
        payload.admissionNumber.toLowerCase(),
      );
      return;
    }

    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STAFF) {
      const payload = this.resolveStaffPayload(row, context);
      await this.staffService.createStaff(
        institutionId,
        authSession,
        scopes,
        payload,
      );
      return;
    }

    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS) {
      const payload = this.resolveGuardianPayload(row, context);
      const guardian = await this.guardiansService.upsertGuardian(
        institutionId,
        authSession,
        scopes,
        {
          name: payload.name,
          mobile: payload.mobile,
          email: payload.email,
        },
      );

      await this.guardiansService.linkStudent(
        institutionId,
        guardian.id,
        authSession,
        scopes,
        {
          studentId: payload.studentId,
          relationship: payload.relationship,
          isPrimary: payload.isPrimary,
        },
      );
      return;
    }

    const payload = this.resolveFeeAssignmentPayload(row, context);
    await this.feesService.createFeeAssignment(
      institutionId,
      authSession,
      scopes,
      payload,
    );
  }

  private async previewRow(
    institutionId: string,
    entityType: DataExchangeEntityType,
    context: PreviewContext,
    row: Record<string, string>,
    rowNumber: number,
  ): Promise<RowResult> {
    const identifier = this.resolveIdentifier(entityType, row);
    const messages: string[] = [];

    try {
      if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STUDENTS) {
        const payload = this.resolveStudentPayload(row, context);
        if (
          context.existingStudentAdmissions.has(
            payload.admissionNumber.toLowerCase(),
          )
        ) {
          messages.push(ERROR_MESSAGES.STUDENTS.ADMISSION_NUMBER_EXISTS);
        }
      } else if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STAFF) {
        this.resolveStaffPayload(row, context);
      } else if (entityType === DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS) {
        this.resolveGuardianPayload(row, context);
      } else if (entityType === DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS) {
        this.resolveFeeAssignmentPayload(row, context);
      }
    } catch (error) {
      messages.push(this.toErrorMessage(error));
    }

    return {
      rowNumber,
      identifier,
      status: messages.length === 0 ? "valid" : "error",
      messages,
    };
  }

  private resolveStudentPayload(
    row: Record<string, string>,
    context: PreviewContext,
  ): StudentImportPayload {
    const admissionNumber = this.required(
      row.admissionNumber,
      "Admission number is required.",
    );
    const firstName = this.required(row.firstName, "First name is required.");
    const campus = this.resolveCampus(row.campusName, context);
    const resolvedClass = this.resolveClass(row.className, campus.id, context);
    const resolvedSection = this.resolveSection(
      row.sectionName,
      resolvedClass.id,
      context,
    );
    const academicYear = this.resolveAcademicYear(
      row.academicYearName,
      context,
    );
    const primaryGuardianNumber = Number.parseInt(
      row.primaryGuardianNumber || "1",
      10,
    );

    const guardians = Array.from(
      { length: GUARDIAN_COLUMN_COUNT },
      (_, index) => {
        const position = index + 1;
        const name = row[`guardian${position}Name`];
        const mobile = row[`guardian${position}Mobile`];
        const email = row[`guardian${position}Email`];
        const relationship = row[`guardian${position}Relationship`];

        if (!(name || mobile || email || relationship)) {
          return null;
        }

        return {
          name: this.required(name, `Guardian ${position} name is required.`),
          mobile: this.required(
            mobile,
            `Guardian ${position} mobile is required.`,
          ),
          email: email || undefined,
          relationship: this.resolveGuardianRelationship(
            relationship,
            `Guardian ${position} relationship is required.`,
          ),
          isPrimary: primaryGuardianNumber === position,
        };
      },
    ).filter(Boolean) as StudentImportPayload["guardians"];

    if (guardians.length === 0) {
      throw new BadRequestException("At least one guardian is required.");
    }

    if (guardians.every((guardian) => !guardian.isPrimary)) {
      throw new BadRequestException("Select one primary guardian.");
    }

    return {
      admissionNumber,
      firstName,
      lastName: row.lastName || undefined,
      campusId: campus.id,
      classId: resolvedClass.id,
      sectionId: resolvedSection.id,
      currentEnrollment: academicYear
        ? {
            academicYearId: academicYear.id,
            classId: resolvedClass.id,
            sectionId: resolvedSection.id,
          }
        : null,
      guardians,
    };
  }

  private resolveStaffPayload(
    row: Record<string, string>,
    context: PreviewContext,
  ): StaffImportPayload {
    const campus = this.resolveCampus(row.campusName, context);
    const status = row.status.toLowerCase() as StaffImportPayload["status"];

    if (
      status !== STATUS.MEMBER.ACTIVE &&
      status !== STATUS.MEMBER.INACTIVE &&
      status !== STATUS.MEMBER.SUSPENDED
    ) {
      throw new BadRequestException(
        "Staff status must be active, inactive, or suspended.",
      );
    }

    return {
      name: this.required(row.name, "Staff name is required."),
      mobile: this.required(row.mobile, "Staff mobile is required."),
      email: row.email || undefined,
      campusId: campus.id,
      status,
    };
  }

  private resolveGuardianPayload(
    row: Record<string, string>,
    context: PreviewContext,
  ): GuardianImportPayload {
    const campus = this.resolveCampus(row.campusName, context);
    const student = this.resolveStudent(row.studentAdmissionNumber, context);

    return {
      name: this.required(row.name, "Guardian name is required."),
      mobile: this.required(row.mobile, "Guardian mobile is required."),
      email: row.email || undefined,
      campusId: campus.id,
      studentId: student.id,
      relationship: this.resolveGuardianRelationship(
        row.relationship,
        "Guardian relationship is required.",
      ),
      isPrimary: this.parseBoolean(
        row.isPrimary,
        "Primary guardian must be true or false.",
      ),
    };
  }

  private resolveFeeAssignmentPayload(
    row: Record<string, string>,
    context: PreviewContext,
  ): FeeAssignmentImportPayload {
    const academicYear = this.resolveAcademicYear(
      row.academicYearName,
      context,
      true,
    );
    const student = this.resolveStudent(row.studentAdmissionNumber, context);
    const structure = this.resolveFeeStructure(
      row.feeStructureName,
      academicYear.id,
      row.campusName,
      context,
    );

    if (
      structure.scope === FEE_STRUCTURE_SCOPES.CAMPUS &&
      structure.campusId !== student.campusId
    ) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_CAMPUS_MISMATCH,
      );
    }

    return {
      feeStructureId: structure.id,
      studentId: student.id,
      notes: row.notes || undefined,
    };
  }

  private parseCsvRows(entityType: DataExchangeEntityType, csvContent: string) {
    const rows = parseCsv(csvContent);

    if (rows.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.DATA_EXCHANGE.CSV_EMPTY);
    }

    const [headerRow, ...dataRows] = rows;

    if (!headerRow) {
      throw new BadRequestException(
        ERROR_MESSAGES.DATA_EXCHANGE.CSV_HEADER_REQUIRED,
      );
    }

    const expectedHeaders = [...DATA_EXCHANGE_HEADERS[entityType]];

    if (headerRow.length !== expectedHeaders.length) {
      throw new BadRequestException(
        `Unexpected CSV headers. Expected: ${expectedHeaders.join(", ")}`,
      );
    }

    expectedHeaders.forEach((header, index) => {
      if (headerRow[index] !== header) {
        throw new BadRequestException(
          `Unexpected CSV header "${headerRow[index]}". Expected "${header}".`,
        );
      }
    });

    if (dataRows.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.DATA_EXCHANGE.CSV_EMPTY);
    }

    return dataRows.map((values) =>
      Object.fromEntries(
        expectedHeaders.map((header, index) => [header, values[index] ?? ""]),
      ),
    );
  }

  private async buildPreviewContext(
    institutionId: string,
    scopes: ResolvedScopes,
  ): Promise<PreviewContext> {
    const [
      campuses,
      years,
      studentRows,
      classRows,
      sectionRows,
      structures,
      existingAdmissions,
    ] = await Promise.all([
      this.db
        .select({ id: campus.id, name: campus.name })
        .from(campus)
        .where(
          and(
            eq(campus.organizationId, institutionId),
            ne(campus.status, STATUS.CAMPUS.DELETED),
            campusScopeFilter(campus.id, scopes),
          ),
        ),
      this.db
        .select({
          id: academicYears.id,
          name: academicYears.name,
          isCurrent: academicYears.isCurrent,
        })
        .from(academicYears)
        .where(
          and(
            eq(academicYears.institutionId, institutionId),
            ne(academicYears.status, STATUS.ACADEMIC_YEAR.DELETED),
          ),
        ),
      this.db
        .select({
          id: students.id,
          admissionNumber: students.admissionNumber,
          campusId: member.primaryCampusId,
        })
        .from(students)
        .innerJoin(member, eq(students.membershipId, member.id))
        .where(
          and(
            eq(students.institutionId, institutionId),
            ne(member.status, STATUS.MEMBER.DELETED),
            campusScopeFilter(member.primaryCampusId, scopes),
          ),
        ),
      this.db
        .select({
          id: schoolClasses.id,
          campusId: schoolClasses.campusId,
          name: schoolClasses.name,
        })
        .from(schoolClasses)
        .where(
          and(
            eq(schoolClasses.institutionId, institutionId),
            ne(schoolClasses.status, STATUS.CLASS.DELETED),
            campusScopeFilter(schoolClasses.campusId, scopes),
          ),
        ),
      this.db
        .select({
          id: classSections.id,
          classId: classSections.classId,
          name: classSections.name,
        })
        .from(classSections)
        .innerJoin(schoolClasses, eq(classSections.classId, schoolClasses.id))
        .where(
          and(
            eq(classSections.institutionId, institutionId),
            eq(classSections.status, STATUS.SECTION.ACTIVE),
            ne(schoolClasses.status, STATUS.CLASS.DELETED),
            campusScopeFilter(schoolClasses.campusId, scopes),
            sectionScopeFilter(classSections.id, scopes),
          ),
        ),
      this.db
        .select({
          id: feeStructures.id,
          name: feeStructures.name,
          academicYearId: feeStructures.academicYearId,
          campusId: feeStructures.campusId,
          scope: feeStructures.scope,
        })
        .from(feeStructures)
        .where(
          and(
            eq(feeStructures.institutionId, institutionId),
            ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
            campusScopeFilter(feeStructures.campusId, scopes),
          ),
        ),
      this.db
        .select({ admissionNumber: students.admissionNumber })
        .from(students)
        .where(eq(students.institutionId, institutionId)),
    ]);

    return {
      campusByName: new Map(
        campuses.map((record) => [record.name.toLowerCase(), record]),
      ),
      academicYearByName: new Map(
        years.map((record) => [record.name.toLowerCase(), record]),
      ),
      studentByAdmissionNumber: new Map(
        studentRows.map((record) => [
          record.admissionNumber.toLowerCase(),
          {
            id: record.id,
            admissionNumber: record.admissionNumber,
            campusId: record.campusId ?? "",
          },
        ]),
      ),
      classByKey: new Map(
        classRows.map((record) => [
          `${record.campusId}:${record.name.toLowerCase()}`,
          record,
        ]),
      ),
      sectionByKey: new Map(
        sectionRows.map((record) => [
          `${record.classId}:${record.name.toLowerCase()}`,
          record,
        ]),
      ),
      feeStructureByKey: new Map(
        structures.map((record) => [
          `${record.academicYearId}:${record.campusId ?? "institution"}:${record.name.toLowerCase()}`,
          record,
        ]),
      ),
      existingStudentAdmissions: new Set(
        existingAdmissions.map((record) =>
          record.admissionNumber.toLowerCase(),
        ),
      ),
    };
  }

  private resolveCampus(campusName: string, context: PreviewContext) {
    const normalizedName = this.required(
      campusName,
      "Campus name is required.",
    ).toLowerCase();
    const matchedCampus = context.campusByName.get(normalizedName);

    if (!matchedCampus) {
      throw new BadRequestException(ERROR_MESSAGES.CAMPUSES.CAMPUS_NOT_FOUND);
    }

    return matchedCampus;
  }

  private resolveAcademicYear(
    academicYearName: string,
    context: PreviewContext,
    required = false,
  ) {
    if (!academicYearName && !required) {
      const currentYear = [...context.academicYearByName.values()].find(
        (record) => record.isCurrent,
      );

      if (!currentYear) {
        throw new BadRequestException(
          ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND,
        );
      }

      return currentYear;
    }

    const normalizedName = this.required(
      academicYearName,
      "Academic year name is required.",
    ).toLowerCase();
    const matchedYear = context.academicYearByName.get(normalizedName);

    if (!matchedYear) {
      throw new BadRequestException(
        ERROR_MESSAGES.ACADEMIC_YEARS.YEAR_NOT_FOUND,
      );
    }

    return matchedYear;
  }

  private resolveClass(
    className: string,
    campusId: string,
    context: PreviewContext,
  ) {
    const matchedClass = context.classByKey.get(
      `${campusId}:${this.required(className, "Class name is required.").toLowerCase()}`,
    );

    if (!matchedClass) {
      throw new BadRequestException(ERROR_MESSAGES.CLASSES.CLASS_NOT_FOUND);
    }

    return matchedClass;
  }

  private resolveSection(
    sectionName: string,
    classId: string,
    context: PreviewContext,
  ) {
    const matchedSection = context.sectionByKey.get(
      `${classId}:${this.required(sectionName, "Section name is required.").toLowerCase()}`,
    );

    if (!matchedSection) {
      throw new BadRequestException(ERROR_MESSAGES.CLASSES.SECTION_NOT_FOUND);
    }

    return matchedSection;
  }

  private resolveStudent(admissionNumber: string, context: PreviewContext) {
    const matchedStudent = context.studentByAdmissionNumber.get(
      this.required(
        admissionNumber,
        "Student admission number is required.",
      ).toLowerCase(),
    );

    if (!matchedStudent) {
      throw new BadRequestException(ERROR_MESSAGES.STUDENTS.STUDENT_NOT_FOUND);
    }

    return matchedStudent;
  }

  private resolveFeeStructure(
    feeStructureName: string,
    academicYearId: string,
    campusName: string,
    context: PreviewContext,
  ) {
    const campusKey = campusName
      ? this.resolveCampus(campusName, context).id
      : "institution";
    const fallbackKey = `${academicYearId}:institution:${this.required(
      feeStructureName,
      "Fee structure name is required.",
    ).toLowerCase()}`;
    const scopedKey = `${academicYearId}:${campusKey}:${feeStructureName.toLowerCase()}`;
    const matchedStructure =
      context.feeStructureByKey.get(scopedKey) ??
      context.feeStructureByKey.get(fallbackKey);

    if (!matchedStructure) {
      throw new BadRequestException(
        ERROR_MESSAGES.FEES.FEE_STRUCTURE_NOT_FOUND,
      );
    }

    return matchedStructure;
  }

  private resolveGuardianRelationship(
    relationship: string,
    missingMessage: string,
  ): GuardianRelationship {
    const normalizedRelationship = this.required(
      relationship,
      missingMessage,
    ).toLowerCase();

    if (
      normalizedRelationship !== GUARDIAN_RELATIONSHIPS.FATHER &&
      normalizedRelationship !== GUARDIAN_RELATIONSHIPS.MOTHER &&
      normalizedRelationship !== GUARDIAN_RELATIONSHIPS.GUARDIAN
    ) {
      throw new BadRequestException(
        "Relationship must be father, mother, or guardian.",
      );
    }

    return normalizedRelationship;
  }

  private parseBoolean(value: string, errorMessage: string) {
    const normalizedValue = value.trim().toLowerCase();

    if (BOOLEAN_TRUE_VALUES.has(normalizedValue)) {
      return true;
    }

    if (BOOLEAN_FALSE_VALUES.has(normalizedValue)) {
      return false;
    }

    throw new BadRequestException(errorMessage);
  }

  private resolveIdentifier(
    entityType: DataExchangeEntityType,
    row: Record<string, string>,
  ) {
    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STUDENTS) {
      return row.admissionNumber || `Student row ${row.firstName || ""}`.trim();
    }

    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.STAFF) {
      return row.mobile || row.name || "Staff row";
    }

    if (entityType === DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS) {
      return row.mobile || row.name || "Guardian row";
    }

    return `${row.studentAdmissionNumber || "student"} / ${row.feeStructureName || "fee structure"}`;
  }

  private required(value: string, errorMessage: string) {
    const trimmedValue = value?.trim();

    if (!trimmedValue) {
      throw new BadRequestException(errorMessage);
    }

    return trimmedValue;
  }

  private async assertPermission(
    institutionId: string,
    authSession: AuthenticatedSession,
    entityType: DataExchangeEntityType,
    action: DataExchangeAction,
  ) {
    const permissions = await this.resolvePermissions(
      authSession,
      institutionId,
    );
    const requiredPermission = ENTITY_ACTION_PERMISSIONS[entityType][action];

    if (!permissions.has(requiredPermission)) {
      throw new ForbiddenException(ERROR_MESSAGES.AUTH.PERMISSION_DENIED);
    }
  }

  private resolvePermissions(
    authSession: AuthenticatedSession,
    institutionId: string,
  ) {
    return this.authService.resolvePermissions(
      authSession.user.id,
      institutionId,
    );
  }

  private toErrorMessage(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Import failed for this row.";
  }

  private async exportStudents(institutionId: string, scopes: ResolvedScopes) {
    const rows = await this.db
      .select({
        id: students.id,
        membershipId: students.membershipId,
        admissionNumber: students.admissionNumber,
        firstName: students.firstName,
        lastName: students.lastName,
        campusName: campus.name,
        className: schoolClasses.name,
        sectionName: classSections.name,
        academicYearName: academicYears.name,
      })
      .from(students)
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .innerJoin(schoolClasses, eq(students.classId, schoolClasses.id))
      .innerJoin(classSections, eq(students.sectionId, classSections.id))
      .leftJoin(
        studentCurrentEnrollments,
        and(
          eq(
            studentCurrentEnrollments.studentMembershipId,
            students.membershipId,
          ),
          isNull(studentCurrentEnrollments.deletedAt),
        ),
      )
      .leftJoin(
        academicYears,
        eq(studentCurrentEnrollments.academicYearId, academicYears.id),
      )
      .where(
        and(
          eq(students.institutionId, institutionId),
          ne(member.status, STATUS.MEMBER.DELETED),
          campusScopeFilter(member.primaryCampusId, scopes),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(asc(students.admissionNumber));

    const guardians = rows.length
      ? await this.db
          .select({
            studentMembershipId: studentGuardianLinks.studentMembershipId,
            name: user.name,
            mobile: user.mobile,
            email: user.email,
            relationship: studentGuardianLinks.relationship,
            isPrimary: studentGuardianLinks.isPrimary,
          })
          .from(studentGuardianLinks)
          .innerJoin(
            member,
            eq(studentGuardianLinks.parentMembershipId, member.id),
          )
          .innerJoin(user, eq(member.userId, user.id))
          .where(
            and(
              inArray(
                studentGuardianLinks.studentMembershipId,
                rows.map((row) => row.membershipId),
              ),
              isNull(studentGuardianLinks.deletedAt),
            ),
          )
      : [];

    const guardiansByStudentMembership = new Map<string, typeof guardians>();
    guardians.forEach((guardian) => {
      const current =
        guardiansByStudentMembership.get(guardian.studentMembershipId) ?? [];
      current.push(guardian);
      guardiansByStudentMembership.set(guardian.studentMembershipId, current);
    });

    return rows.map((row) => {
      const rowGuardians =
        guardiansByStudentMembership
          .get(row.membershipId)
          ?.slice(0, GUARDIAN_COLUMN_COUNT) ?? [];
      const primaryGuardianNumber =
        rowGuardians.findIndex((guardian) => guardian.isPrimary) + 1 || 1;

      return [
        row.admissionNumber,
        row.firstName,
        row.lastName ?? "",
        row.campusName,
        row.className,
        row.sectionName,
        row.academicYearName ?? "",
        String(primaryGuardianNumber),
        ...Array.from({ length: GUARDIAN_COLUMN_COUNT }, (_, index) => {
          const guardian = rowGuardians[index];
          return [
            guardian?.name ?? "",
            guardian?.mobile ?? "",
            guardian?.email ?? "",
            guardian?.relationship ?? "",
          ];
        }).flat(),
      ];
    });
  }

  private async exportStaff(institutionId: string, scopes: ResolvedScopes) {
    const rows = await this.db
      .select({
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        campusName: campus.name,
        status: member.status,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
          campusScopeFilter(member.primaryCampusId, scopes),
        ),
      )
      .orderBy(asc(user.name));

    return rows.map((row) => [
      row.name,
      row.mobile,
      row.email ?? "",
      row.campusName,
      row.status,
    ]);
  }

  private async exportGuardians(institutionId: string, scopes: ResolvedScopes) {
    const rows = await this.db
      .select({
        guardianId: member.id,
        name: user.name,
        mobile: user.mobile,
        email: user.email,
        campusName: campus.name,
      })
      .from(member)
      .innerJoin(user, eq(member.userId, user.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(member.organizationId, institutionId),
          eq(member.memberType, MEMBER_TYPES.GUARDIAN),
          ne(member.status, STATUS.MEMBER.DELETED),
          campusScopeFilter(member.primaryCampusId, scopes),
        ),
      )
      .orderBy(asc(user.name));

    const linkedStudents = rows.length
      ? await this.db
          .select({
            guardianId: studentGuardianLinks.parentMembershipId,
            admissionNumber: students.admissionNumber,
            relationship: studentGuardianLinks.relationship,
            isPrimary: studentGuardianLinks.isPrimary,
          })
          .from(studentGuardianLinks)
          .innerJoin(
            students,
            eq(studentGuardianLinks.studentMembershipId, students.membershipId),
          )
          .where(
            and(
              inArray(
                studentGuardianLinks.parentMembershipId,
                rows.map((row) => row.guardianId),
              ),
              isNull(studentGuardianLinks.deletedAt),
            ),
          )
      : [];

    const linksByGuardian = new Map<string, typeof linkedStudents>();
    linkedStudents.forEach((link) => {
      const current = linksByGuardian.get(link.guardianId) ?? [];
      current.push(link);
      linksByGuardian.set(link.guardianId, current);
    });

    return rows.flatMap((row) => {
      const links = linksByGuardian.get(row.guardianId) ?? [null];

      return links.map((link) => [
        row.name,
        row.mobile,
        row.email ?? "",
        row.campusName,
        link?.admissionNumber ?? "",
        link?.relationship ?? "",
        link ? String(link.isPrimary) : "",
      ]);
    });
  }

  private async exportFeeAssignments(
    institutionId: string,
    scopes: ResolvedScopes,
  ) {
    const rows = await this.db
      .select({
        feeStructureId: feeAssignments.feeStructureId,
        studentId: feeAssignments.studentId,
        notes: feeAssignments.notes,
        academicYearName: academicYears.name,
        campusName: campus.name,
        feeStructureName: feeStructures.name,
        studentAdmissionNumber: students.admissionNumber,
        createdAt: feeAssignments.createdAt,
      })
      .from(feeAssignments)
      .innerJoin(
        feeStructures,
        eq(feeAssignments.feeStructureId, feeStructures.id),
      )
      .innerJoin(
        academicYears,
        eq(feeStructures.academicYearId, academicYears.id),
      )
      .innerJoin(students, eq(feeAssignments.studentId, students.id))
      .innerJoin(member, eq(students.membershipId, member.id))
      .innerJoin(campus, eq(member.primaryCampusId, campus.id))
      .where(
        and(
          eq(feeAssignments.institutionId, institutionId),
          ne(feeStructures.status, STATUS.FEE_STRUCTURE.DELETED),
          campusScopeFilter(member.primaryCampusId, scopes),
          sectionScopeFilter(students.sectionId, scopes),
        ),
      )
      .orderBy(desc(feeAssignments.createdAt));

    const dedupedRows = new Map<string, (typeof rows)[number]>();
    rows.forEach((row) => {
      const key = `${row.feeStructureId}:${row.studentId}`;
      if (!dedupedRows.has(key)) {
        dedupedRows.set(key, row);
      }
    });

    return [...dedupedRows.values()]
      .sort((left, right) =>
        left.studentAdmissionNumber.localeCompare(right.studentAdmissionNumber),
      )
      .map((row) => [
        row.academicYearName,
        row.campusName,
        row.feeStructureName,
        row.studentAdmissionNumber,
        row.notes ?? "",
      ]);
  }
}
