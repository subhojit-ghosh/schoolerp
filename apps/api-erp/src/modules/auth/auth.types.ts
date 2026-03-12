import type {
  CampusStatus,
  MemberStatus,
  MemberType,
  OrgStatus,
} from "../../constants";

export type AuthenticatedUser = {
  id: string;
  name: string;
  mobile: string;
  email: string | null;
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
  activeCampusId: string | null;
};

export type AuthContext = {
  user: AuthenticatedUser;
  expiresAt: Date;
  memberships: AuthenticatedMembership[];
  activeOrganization: AuthenticatedOrganization | null;
  activeCampus: AuthenticatedCampus | null;
  campuses: AuthenticatedCampus[];
};

export type SessionRequestContext = {
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type SessionAccessContext = {
  activeOrganizationId?: string | null;
  activeCampusId?: string | null;
};

export type PasswordResetRequestResult = {
  success: boolean;
  resetTokenPreview: string | null;
};
