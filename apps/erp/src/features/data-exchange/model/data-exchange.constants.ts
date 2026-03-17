import {
  DATA_EXCHANGE_ENTITY_TYPES,
  PERMISSIONS,
  type DataExchangeEntityType,
  type PermissionSlug,
} from "@repo/contracts";

export const DATA_EXCHANGE_ENTITY_LABELS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: "Students",
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: "Staff",
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: "Guardians",
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: "Fee Assignments",
} as const satisfies Record<DataExchangeEntityType, string>;

export const DATA_EXCHANGE_ENTITY_DESCRIPTIONS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]:
    "Import admissions with guardians and current enrollment, or export the current student roster.",
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]:
    "Import staff onboarding rows or export the active staff directory.",
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]:
    "Import guardian links for existing students or export guardian relationship records.",
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]:
    "Assign existing fee structures in bulk or export student-to-structure assignments.",
} as const satisfies Record<DataExchangeEntityType, string>;

export const DATA_EXCHANGE_ENTITY_IMPORT_PERMISSIONS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: [PERMISSIONS.STUDENTS_MANAGE],
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: [PERMISSIONS.STAFF_MANAGE],
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: [PERMISSIONS.GUARDIANS_MANAGE],
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: [PERMISSIONS.FEES_MANAGE],
} as const satisfies Record<DataExchangeEntityType, PermissionSlug[]>;

export const DATA_EXCHANGE_ENTITY_EXPORT_PERMISSIONS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: [PERMISSIONS.STUDENTS_READ],
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: [PERMISSIONS.STAFF_READ],
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: [PERMISSIONS.GUARDIANS_READ],
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: [PERMISSIONS.FEES_READ],
} as const satisfies Record<DataExchangeEntityType, PermissionSlug[]>;

export const DATA_EXCHANGE_TAB_VALUES = {
  IMPORT: "import",
  EXPORT: "export",
} as const;
