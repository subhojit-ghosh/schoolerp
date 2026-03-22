import type { AuthContextKey, PermissionSlug } from "@repo/contracts";
import type {
  CampusStatus,
  GuardianRelationship,
  MemberStatus,
  MemberType,
  OrgStatus,
} from "../../constants";

export type AuthenticatedUser = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
  institutionId: string | null;
};

export type ValidatedUser = AuthenticatedUser & {
  mustChangePassword: boolean;
};

export type AuthenticatedMembership = {
  id: string;
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  memberType: MemberType;
  status: MemberStatus;
  primaryCampusId: string | null;
};

export type AuthenticatedOrganization = {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  institutionType: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  sidebarColor: string;
  status: OrgStatus;
};

export type AuthenticatedCampus = {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  code: string | null;
  isDefault: boolean;
  status: CampusStatus;
};

export type AuthenticatedSession = {
  token: string;
  expiresAt: Date;
  user: AuthenticatedUser;
  activeOrganizationId: string | null;
  activeContextKey: AuthContextKey | null;
  activeCampusId: string | null;
};

export type AuthenticatedAccessContext = {
  key: AuthContextKey;
  label: (typeof import("@repo/contracts").AUTH_CONTEXT_LABELS)[AuthContextKey];
  membershipIds: string[];
};

export type AuthenticatedStaffRole = {
  id: string;
  name: string;
  slug: string;
};

export type AuthenticatedLinkedStudent = {
  studentId: string;
  membershipId: string;
  fullName: string;
  admissionNumber: string;
  campusId: string;
  campusName: string;
  relationship: GuardianRelationship | null;
};

export type AuthContext = {
  user: AuthenticatedUser;
  expiresAt: Date;
  memberships: AuthenticatedMembership[];
  activeOrganization: AuthenticatedOrganization | null;
  availableContexts: AuthenticatedAccessContext[];
  activeContext: AuthenticatedAccessContext | null;
  permissions: PermissionSlug[];
  activeStaffRoles: AuthenticatedStaffRole[];
  activeCampus: AuthenticatedCampus | null;
  campuses: AuthenticatedCampus[];
  linkedStudents: AuthenticatedLinkedStudent[];
};

export type ResolvedScopes = {
  campusIds: string[] | "all";
  classIds: string[] | "all";
  sectionIds: string[] | "all";
};

export type SessionRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionAccessContext = {
  activeOrganizationId?: string | null;
  activeContextKey?: AuthContextKey | null;
  activeCampusId?: string | null;
};

export type PasswordResetRequestResult = {
  success: boolean;
  resetTokenPreview: string | null;
};

export type IssuedPasswordSetupResult = PasswordResetRequestResult & {
  channel: import("../../constants").AuthRecoveryChannel;
  recipient: string;
};
