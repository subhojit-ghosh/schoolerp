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
  { id: "role_super_admin", name: "Super Admin", slug: "super_admin", roleType: "platform", institutionId: null, isSystem: true, isConfigurable: false },
  // System
  { id: "role_institution_admin", name: "Institution Admin", slug: "institution_admin", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_student", name: "Student", slug: "student", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  { id: "role_parent", name: "Parent", slug: "parent", roleType: "system", institutionId: null, isSystem: true, isConfigurable: false },
  // Staff presets
  { id: "role_principal", name: "Principal", slug: "principal", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_teacher", name: "Teacher", slug: "teacher", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_accountant", name: "Accountant", slug: "accountant", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_librarian", name: "Librarian", slug: "librarian", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
  { id: "role_receptionist", name: "Receptionist", slug: "receptionist", roleType: "staff", institutionId: null, isSystem: false, isConfigurable: true },
];

export const BUILT_IN_PERMISSIONS = [
  { id: "perm_fees_read",        slug: "fees:read",        description: "View fee records" },
  { id: "perm_fees_write",       slug: "fees:write",       description: "Create and update fee records" },
  { id: "perm_fees_delete",      slug: "fees:delete",      description: "Delete fee records" },
  { id: "perm_attendance_read",  slug: "attendance:read",  description: "View attendance records" },
  { id: "perm_attendance_write", slug: "attendance:write", description: "Mark and update attendance" },
  { id: "perm_students_read",    slug: "students:read",    description: "View student records" },
  { id: "perm_students_write",   slug: "students:write",   description: "Create and update student records" },
  { id: "perm_students_delete",  slug: "students:delete",  description: "Delete student records" },
  { id: "perm_grades_read",      slug: "grades:read",      description: "View grades" },
  { id: "perm_grades_write",     slug: "grades:write",     description: "Enter and update grades" },
  { id: "perm_roles_manage",     slug: "roles:manage",     description: "Create and manage roles" },
  { id: "perm_members_invite",   slug: "members:invite",   description: "Invite new members to institution" },
  { id: "perm_reports_export",   slug: "reports:export",   description: "Export reports" },
  { id: "perm_library_read",     slug: "library:read",     description: "View library records" },
  { id: "perm_library_write",    slug: "library:write",    description: "Manage library records" },
  { id: "perm_admissions_read",  slug: "admissions:read",  description: "View admission records" },
  { id: "perm_admissions_write", slug: "admissions:write", description: "Process admissions" },
] satisfies { id: string; slug: string; description: string }[];

const ALL_PERMISSION_SLUGS = BUILT_IN_PERMISSIONS.map((p) => p.slug);

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  institution_admin: ALL_PERMISSION_SLUGS,
  principal: ALL_PERMISSION_SLUGS.filter((s) => s !== "roles:manage" && s !== "members:invite"),
  teacher: ["attendance:write", "students:read", "grades:read", "grades:write"],
  accountant: ["fees:read", "fees:write", "reports:export"],
  librarian: ["library:read", "library:write"],
  receptionist: ["students:read", "admissions:read"],
  student: ["students:read"],
  parent: ["students:read", "grades:read", "attendance:read", "fees:read"],
  super_admin: [],
};
