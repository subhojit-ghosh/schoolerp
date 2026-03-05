import { ROLES, PERMISSIONS, ROLE_TYPES, STATUS } from "@/constants";

export type BuiltInRole = {
  id: string;
  name: string;
  slug: string;
  roleType: "platform" | "system" | "staff";
  institutionId: null;
  isSystem: boolean;
  isConfigurable: boolean;
};

export const BUILT_IN_ROLES: BuiltInRole[] = [
  // Platform
  { id: "role_super_admin", name: "Super Admin", slug: ROLES.SUPER_ADMIN, roleType: ROLE_TYPES.PLATFORM, institutionId: null, isSystem: true, isConfigurable: false },
  // System
  { id: "role_institution_admin", name: "Institution Admin", slug: ROLES.INSTITUTION_ADMIN, roleType: ROLE_TYPES.SYSTEM, institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_student", name: "Student", slug: ROLES.STUDENT, roleType: ROLE_TYPES.SYSTEM, institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_parent", name: "Parent", slug: ROLES.PARENT, roleType: ROLE_TYPES.SYSTEM, institutionId: null, isSystem: true, isConfigurable: false },
  // Staff presets
  { id: "role_principal", name: "Principal", slug: ROLES.PRINCIPAL, roleType: ROLE_TYPES.STAFF, institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_teacher", name: "Teacher", slug: ROLES.TEACHER, roleType: ROLE_TYPES.STAFF, institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_accountant", name: "Accountant", slug: ROLES.ACCOUNTANT, roleType: ROLE_TYPES.STAFF, institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_librarian", name: "Librarian", slug: ROLES.LIBRARIAN, roleType: ROLE_TYPES.STAFF, institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_receptionist", name: "Receptionist", slug: ROLES.RECEPTIONIST, roleType: ROLE_TYPES.STAFF, institutionId: null, isSystem: false, isConfigurable: true },
];

export const BUILT_IN_PERMISSIONS = [
  { id: "perm_fees_read",        slug: PERMISSIONS.FEES.READ,        description: "View fee records" },
  { id: "perm_fees_write",       slug: PERMISSIONS.FEES.WRITE,       description: "Create and update fee records" },
  { id: "perm_fees_delete",      slug: PERMISSIONS.FEES.DELETE,      description: "Delete fee records" },
  { id: "perm_attendance_read",  slug: PERMISSIONS.ATTENDANCE.READ,  description: "View attendance records" },
  { id: "perm_attendance_write", slug: PERMISSIONS.ATTENDANCE.WRITE, description: "Mark and update attendance" },
  { id: "perm_students_read",    slug: PERMISSIONS.STUDENTS.READ,    description: "View student records" },
  { id: "perm_students_write",   slug: PERMISSIONS.STUDENTS.WRITE,   description: "Create and update student records" },
  { id: "perm_students_delete",  slug: PERMISSIONS.STUDENTS.DELETE,  description: "Delete student records" },
  { id: "perm_grades_read",      slug: PERMISSIONS.GRADES.READ,      description: "View grades" },
  { id: "perm_grades_write",     slug: PERMISSIONS.GRADES.WRITE,     description: "Enter and update grades" },
  { id: "perm_roles_manage",     slug: PERMISSIONS.ROLES.MANAGE,     description: "Create and manage roles" },
  { id: "perm_members_invite",   slug: PERMISSIONS.MEMBERS.INVITE,   description: "Invite new members to institution" },
  { id: "perm_reports_export",   slug: PERMISSIONS.REPORTS.EXPORT,   description: "Export reports" },
  { id: "perm_library_read",     slug: PERMISSIONS.LIBRARY.READ,     description: "View library records" },
  { id: "perm_library_write",    slug: PERMISSIONS.LIBRARY.WRITE,    description: "Manage library records" },
  { id: "perm_admissions_read",  slug: PERMISSIONS.ADMISSIONS.READ,  description: "View admission records" },
  { id: "perm_admissions_write", slug: PERMISSIONS.ADMISSIONS.WRITE, description: "Process admissions" },
] satisfies { id: string; slug: string; description: string }[];

const ALL_PERMISSION_SLUGS = BUILT_IN_PERMISSIONS.map((p) => p.slug);

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  [ROLES.INSTITUTION_ADMIN]: ALL_PERMISSION_SLUGS,
  [ROLES.PRINCIPAL]: ALL_PERMISSION_SLUGS.filter(
    (s) => s !== PERMISSIONS.ROLES.MANAGE && s !== PERMISSIONS.MEMBERS.INVITE,
  ),
  [ROLES.TEACHER]: [
    PERMISSIONS.ATTENDANCE.WRITE,
    PERMISSIONS.STUDENTS.READ,
    PERMISSIONS.GRADES.READ,
    PERMISSIONS.GRADES.WRITE,
  ],
  [ROLES.ACCOUNTANT]: [
    PERMISSIONS.FEES.READ,
    PERMISSIONS.FEES.WRITE,
    PERMISSIONS.REPORTS.EXPORT,
  ],
  [ROLES.LIBRARIAN]: [PERMISSIONS.LIBRARY.READ, PERMISSIONS.LIBRARY.WRITE],
  [ROLES.RECEPTIONIST]: [PERMISSIONS.STUDENTS.READ, PERMISSIONS.ADMISSIONS.READ],
  [ROLES.STUDENT]: [PERMISSIONS.STUDENTS.READ],
  [ROLES.PARENT]: [
    PERMISSIONS.STUDENTS.READ,
    PERMISSIONS.GRADES.READ,
    PERMISSIONS.ATTENDANCE.READ,
    PERMISSIONS.FEES.READ,
  ],
  [ROLES.SUPER_ADMIN]: [],
};

type InstitutionType = "primary_school" | "high_school" | "college";

const institutionNames: { name: string; slug: string; type: InstitutionType }[] = [
  { name: "Greenwood International School", slug: "greenwood", type: "high_school" },
  { name: "St. Xavier's College", slug: "st-xaviers", type: "college" },
  { name: "Sunrise Primary Academy", slug: "sunrise-primary", type: "primary_school" },
  { name: "Delhi Public School", slug: "dps-main", type: "high_school" },
  { name: "National Institute of Technology", slug: "nit-central", type: "college" },
  { name: "Little Stars Kindergarten", slug: "little-stars", type: "primary_school" },
  { name: "Cambridge High School", slug: "cambridge-hs", type: "high_school" },
  { name: "Presidency University", slug: "presidency-uni", type: "college" },
  { name: "Rainbow Primary School", slug: "rainbow-primary", type: "primary_school" },
  { name: "Modern Public School", slug: "modern-public", type: "high_school" },
  { name: "St. Mary's Convent School", slug: "st-marys", type: "high_school" },
  { name: "IIT Academy", slug: "iit-academy", type: "college" },
  { name: "Bright Future School", slug: "bright-future", type: "primary_school" },
  { name: "Heritage International School", slug: "heritage-intl", type: "high_school" },
  { name: "Lakeside College of Arts", slug: "lakeside-arts", type: "college" },
];

export const SEED_INSTITUTIONS = institutionNames.map((inst, i) => ({
  id: crypto.randomUUID(),
  name: inst.name,
  slug: inst.slug,
  institutionType: inst.type,
  status: i % 5 === 4 ? STATUS.ORG.SUSPENDED : STATUS.ORG.ACTIVE,
  createdAt: new Date(Date.now() - i * 86400000),
}));
