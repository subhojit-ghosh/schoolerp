import type { Request } from "express";
import type { AuthenticatedSession, AuthenticatedUser } from "../auth/auth.types";
import type { OrgStatus } from "../../constants";

export type TenantInstitution = {
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
  fontHeading: string | null;
  fontBody: string | null;
  fontMono: string | null;
  borderRadius: string | null;
  uiDensity: string | null;
  status: OrgStatus;
};

export type TenantRequest = Request & {
  authSession?: AuthenticatedSession;
  tenantInstitution?: TenantInstitution;
  user?: AuthenticatedUser;
};
