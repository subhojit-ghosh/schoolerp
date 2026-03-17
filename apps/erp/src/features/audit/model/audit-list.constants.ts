export const AUDIT_LIST_SORT_FIELDS = {
  CREATED_AT: "createdAt",
  ACTION: "action",
  ENTITY_TYPE: "entityType",
  ACTOR: "actor",
} as const;

export const AUDIT_FILTER_QUERY_PARAMS = {
  ACTION: "action",
  ENTITY_TYPE: "entityType",
} as const;

export const AUDIT_PAGE_COPY = {
  TITLE: "Audit Trail",
  DESCRIPTION:
    "Review sensitive operational changes across roles, attendance, exams, fees, and rollover actions.",
  SEARCH_PLACEHOLDER: "Search summary, entity, or actor...",
  EMPTY_TITLE: "No audit entries found",
  EMPTY_DESCRIPTION:
    "Sensitive actions will appear here once staff start changing operational records.",
  EMPTY_FILTERED_TITLE: "No matching audit entries",
  EMPTY_FILTERED_DESCRIPTION:
    "Adjust the filters or search term to see more audit activity.",
  ERROR_TITLE: "Could not load the audit trail",
} as const;

export const AUDIT_ACTION_OPTIONS = [
  { label: "All actions", value: "all" },
  { label: "Create", value: "create" },
  { label: "Update", value: "update" },
  { label: "Delete", value: "delete" },
  { label: "Mark", value: "mark" },
  { label: "Replace", value: "replace" },
  { label: "Reverse", value: "reverse" },
  { label: "Execute", value: "execute" },
] as const;

export const AUDIT_ENTITY_OPTIONS = [
  { label: "All entities", value: "all" },
  { label: "Roles", value: "role" },
  { label: "Attendance", value: "attendance_day" },
  { label: "Exam Marks", value: "exam_marks" },
  { label: "Fee Payments", value: "fee_payment" },
  { label: "Student Rollover", value: "student_rollover" },
] as const;

export function formatAuditActionLabel(action: string) {
  switch (action) {
    case "create":
      return "Create";
    case "update":
      return "Update";
    case "delete":
      return "Delete";
    case "mark":
      return "Mark";
    case "replace":
      return "Replace";
    case "reverse":
      return "Reverse";
    case "execute":
      return "Execute";
    default:
      return action;
  }
}

export function formatAuditEntityLabel(entityType: string) {
  switch (entityType) {
    case "role":
      return "Role";
    case "attendance_day":
      return "Attendance";
    case "exam_marks":
      return "Exam Marks";
    case "fee_payment":
      return "Fee Payment";
    case "student_rollover":
      return "Student Rollover";
    default:
      return entityType;
  }
}
