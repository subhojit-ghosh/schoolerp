import {
  DATA_EXCHANGE_ENTITY_TYPES,
  type DataExchangeEntityType,
} from "@repo/contracts";

export const CSV_SEPARATOR = ",";
export const GUARDIAN_COLUMN_COUNT = 3;

export const DATA_EXCHANGE_HEADERS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: [
    "admissionNumber",
    "firstName",
    "lastName",
    "campusName",
    "className",
    "sectionName",
    "academicYearName",
    "primaryGuardianNumber",
    "guardian1Name",
    "guardian1Mobile",
    "guardian1Email",
    "guardian1Relationship",
    "guardian2Name",
    "guardian2Mobile",
    "guardian2Email",
    "guardian2Relationship",
    "guardian3Name",
    "guardian3Mobile",
    "guardian3Email",
    "guardian3Relationship",
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: [
    "name",
    "mobile",
    "email",
    "campusName",
    "status",
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: [
    "name",
    "mobile",
    "email",
    "campusName",
    "studentAdmissionNumber",
    "relationship",
    "isPrimary",
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: [
    "academicYearName",
    "campusName",
    "feeStructureName",
    "studentAdmissionNumber",
    "notes",
  ],
} as const satisfies Record<DataExchangeEntityType, readonly string[]>;

export const DATA_EXCHANGE_TEMPLATE_ROWS = {
  [DATA_EXCHANGE_ENTITY_TYPES.STUDENTS]: [
    [
      "ADM-001",
      "Aarav",
      "Sharma",
      "Main Campus",
      "Class 5",
      "A",
      "2026-2027",
      "1",
      "Rohit Sharma",
      "9876543210",
      "rohit@example.com",
      "father",
      "Neha Sharma",
      "9876543211",
      "neha@example.com",
      "mother",
      "",
      "",
      "",
      "",
    ],
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.STAFF]: [
    ["Meera Singh", "9876543212", "meera@example.com", "Main Campus", "active"],
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.GUARDIANS]: [
    ["Rohit Sharma", "9876543210", "rohit@example.com", "Main Campus", "ADM-001", "father", "true"],
  ],
  [DATA_EXCHANGE_ENTITY_TYPES.FEE_ASSIGNMENTS]: [
    ["2026-2027", "Main Campus", "Tuition Fee", "ADM-001", "Imported from April onboarding sheet"],
  ],
} as const satisfies Record<DataExchangeEntityType, readonly string[][]>;

export function parseCsv(csvContent: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let index = 0; index < csvContent.length; index += 1) {
    const character = csvContent[index]!;
    const nextCharacter = csvContent[index + 1];

    if (character === "\"") {
      if (inQuotes && nextCharacter === "\"") {
        currentCell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === CSV_SEPARATOR && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += character;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows
    .map((row) => row.map((value) => value.trim()))
    .filter((row) => row.some((value) => value.length > 0));
}

export function stringifyCsv(rows: readonly string[][]) {
  return rows
    .map((row) =>
      row
        .map((value) => {
          if (
            value.includes(CSV_SEPARATOR) ||
            value.includes("\"") ||
            value.includes("\n")
          ) {
            return `"${value.replaceAll("\"", "\"\"")}"`;
          }

          return value;
        })
        .join(CSV_SEPARATOR),
    )
    .join("\n");
}

export function buildTemplateCsv(entityType: DataExchangeEntityType) {
  return stringifyCsv([
    [...DATA_EXCHANGE_HEADERS[entityType]],
    ...DATA_EXCHANGE_TEMPLATE_ROWS[entityType].map((row) => [...row]),
  ]);
}
