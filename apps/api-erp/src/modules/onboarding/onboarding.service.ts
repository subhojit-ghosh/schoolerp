import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import { Inject, Injectable, ConflictException } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  campus,
  campusMemberships,
  member,
  membershipRoles,
  organization,
  roles,
  user,
} from "@repo/database";
import { eq, and, isNull } from "drizzle-orm";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  ROLE_NAMES,
  ROLE_SLUGS,
  ROLE_TYPES,
  STATUS,
} from "../../constants";
import { AuthService } from "../auth/auth.service";
import type { SessionRequestContext } from "../auth/auth.types";
import {
  deriveShortName,
  normalizeMobile,
  normalizeOptionalEmail,
  slugifyValue,
} from "../auth/auth.utils";
import type { CreateInstitutionOnboardingDto } from "./onboarding.schemas";

const DEFAULT_BRANDING = {
  PRIMARY_COLOR: "#8a5a44",
  ACCENT_COLOR: "#d59f6a",
  SIDEBAR_COLOR: "#32241c",
} as const;

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async createInstitution(
    payload: CreateInstitutionOnboardingDto,
    requestContext: SessionRequestContext,
  ) {
    const institutionSlug = slugifyValue(payload.institutionSlug);
    const campusSlug = slugifyValue(payload.campusSlug ?? payload.campusName);
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);

    await this.authService.assertUserIdentityAvailable(
      normalizedMobile,
      normalizedEmail,
    );

    await this.assertInstitutionSlugAvailable(institutionSlug);

    const created = await this.db.transaction(async (tx) => {
      const userId = randomUUID();
      const organizationId = randomUUID();
      const campusId = randomUUID();
      const membershipId = randomUUID();
      const roleId = randomUUID();
      const membershipRoleId = randomUUID();
      const passwordHash = await hash(payload.password, 12);

      await tx.insert(user).values({
        id: userId,
        name: payload.adminName.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
        passwordHash,
      });

      await tx.insert(organization).values({
        id: organizationId,
        name: payload.institutionName.trim(),
        shortName:
          payload.institutionShortName?.trim() ||
          deriveShortName(payload.institutionName),
        slug: institutionSlug,
        institutionType: null,
        logoUrl: null,
        faviconUrl: null,
        primaryColor: DEFAULT_BRANDING.PRIMARY_COLOR,
        accentColor: DEFAULT_BRANDING.ACCENT_COLOR,
        sidebarColor: DEFAULT_BRANDING.SIDEBAR_COLOR,
        status: STATUS.ORG.ACTIVE,
      });

      await tx.insert(campus).values({
        id: campusId,
        organizationId,
        name: payload.campusName.trim(),
        slug: campusSlug,
        code: null,
        isDefault: true,
        status: STATUS.CAMPUS.ACTIVE,
      });

      await tx.insert(member).values({
        id: membershipId,
        organizationId,
        userId,
        primaryCampusId: campusId,
        memberType: MEMBER_TYPES.STAFF,
        status: STATUS.MEMBER.ACTIVE,
      });

      await tx.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId,
        campusId,
      });

      await tx.insert(roles).values({
        id: roleId,
        name: ROLE_NAMES.INSTITUTION_ADMIN,
        slug: ROLE_SLUGS.INSTITUTION_ADMIN,
        roleType: ROLE_TYPES.INSTITUTION,
        institutionId: organizationId,
        isSystem: true,
        isConfigurable: false,
      });

      await tx.insert(membershipRoles).values({
        id: membershipRoleId,
        membershipId,
        roleId,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: null,
        academicYearId: null,
      });

      return {
        user: {
          id: userId,
          name: payload.adminName.trim(),
          mobile: normalizedMobile,
          email: normalizedEmail,
        },
        organizationId,
        campusId,
      };
    });

    const authSession = await this.authService.createSession(
      created.user,
      requestContext,
      {
        activeOrganizationId: created.organizationId,
        activeContextKey: AUTH_CONTEXT_KEYS.STAFF,
        activeCampusId: created.campusId,
      },
    );

    const authContext = this.authService.requireSession(
      await this.authService.getAuthContext(authSession.token),
    );

    return {
      authSession,
      authContext,
    };
  }

  private async assertInstitutionSlugAvailable(institutionSlug: string) {
    const [matchedInstitution] = await this.db
      .select({ id: organization.id })
      .from(organization)
      .where(
        and(
          eq(organization.slug, institutionSlug),
          isNull(organization.deletedAt),
        ),
      )
      .limit(1);

    if (matchedInstitution) {
      throw new ConflictException(
        ERROR_MESSAGES.ONBOARDING.ORGANIZATION_SLUG_EXISTS,
      );
    }
  }
}
