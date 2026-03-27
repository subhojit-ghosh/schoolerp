export const SALARY_COMPONENT_LIST_SORT_FIELDS = {
  NAME: "name",
  TYPE: "type",
  SORT_ORDER: "sortOrder",
  CREATED_AT: "createdAt",
} as const;

export const SALARY_TEMPLATE_LIST_SORT_FIELDS = {
  NAME: "name",
  CREATED_AT: "createdAt",
} as const;

export const SALARY_ASSIGNMENT_LIST_SORT_FIELDS = {
  STAFF_NAME: "staffName",
  EFFECTIVE_FROM: "effectiveFrom",
  CTC: "ctcInPaise",
  CREATED_AT: "createdAt",
} as const;

export const PAYROLL_RUN_LIST_SORT_FIELDS = {
  MONTH: "month",
  YEAR: "year",
  STATUS: "status",
  CREATED_AT: "createdAt",
} as const;

export const PAYSLIP_LIST_SORT_FIELDS = {
  STAFF_NAME: "staffName",
  NET_PAY: "netPayInPaise",
  CREATED_AT: "createdAt",
} as const;

export const SALARY_COMPONENTS_PAGE_COPY = {
  TITLE: "Salary Components",
  DESCRIPTION: "Manage earning and deduction components used in salary templates.",
  EMPTY_TITLE: "No salary components yet",
  EMPTY_DESCRIPTION: "Create salary components to start building salary templates.",
  SEARCH_PLACEHOLDER: "Search components...",
} as const;

export const SALARY_TEMPLATES_PAGE_COPY = {
  TITLE: "Salary Templates",
  DESCRIPTION: "Define reusable salary structures with earning and deduction components.",
  EMPTY_TITLE: "No salary templates yet",
  EMPTY_DESCRIPTION: "Create a salary template to define how salaries are structured.",
  SEARCH_PLACEHOLDER: "Search templates...",
} as const;

export const SALARY_ASSIGNMENTS_PAGE_COPY = {
  TITLE: "Salary Assignments",
  DESCRIPTION: "Assign salary templates to staff members.",
  EMPTY_TITLE: "No salary assignments yet",
  EMPTY_DESCRIPTION: "Assign a salary template to a staff member to start.",
  SEARCH_PLACEHOLDER: "Search by staff name or template...",
} as const;

export const PAYROLL_RUNS_PAGE_COPY = {
  TITLE: "Payroll Runs",
  DESCRIPTION: "Process and manage monthly payroll for staff.",
  EMPTY_TITLE: "No payroll runs yet",
  EMPTY_DESCRIPTION: "Create a payroll run to process salaries for a month.",
  SEARCH_PLACEHOLDER: "Search payroll runs...",
} as const;

export const PAYSLIPS_PAGE_COPY = {
  TITLE: "Payslips",
  DESCRIPTION: "View individual staff payslips for a payroll run.",
  EMPTY_TITLE: "No payslips yet",
  EMPTY_DESCRIPTION: "Process the payroll run to generate payslips.",
  SEARCH_PLACEHOLDER: "Search by staff name or ID...",
} as const;

export const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;
