import { DATABASE } from "@repo/backend-core";
import {
  AUTH_CONTEXT_KEYS,
  DEFAULT_COLOR_PRESET_ID,
  findPresetById,
} from "@repo/contracts";
import { Inject, Injectable, ConflictException } from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  and,
  campus,
  campusMemberships,
  eq,
  isNull,
  member,
  membershipRoles,
  ne,
  organization,
  roles,
  user,
} from "@repo/database";
import { hash } from "bcryptjs";
import { randomUUID } from "node:crypto";
import {
  ERROR_MESSAGES,
  MEMBER_TYPES,
  ROLE_SLUGS,
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

const DEFAULT_PRESET = findPresetById(DEFAULT_COLOR_PRESET_ID) ?? {
  primaryColor: "#3730a3",
  accentColor: "#8b83f7",
  sidebarColor: "#14123a",
};

@Injectable()
export class OnboardingService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async checkSlugAvailability(slug: string): Promise<{ available: boolean }> {
    const normalized = slug.toLowerCase().trim();

    if (!normalized || normalized.length > 63) {
      return { available: false };
    }

    if (!/^[a-z0-9-]+$/.test(normalized)) {
      return { available: false };
    }

    const [existing] = await this.db
      .select({ id: organization.id })
      .from(organization)
      .where(
        and(
          eq(organization.slug, normalized),
          ne(organization.status, STATUS.ORG.DELETED),
        ),
      )
      .limit(1);

    return { available: !existing };
  }

  async createInstitution(
    payload: CreateInstitutionOnboardingDto,
    requestContext: SessionRequestContext,
  ) {
    const institutionSlug = slugifyValue(payload.institutionSlug);
    const campusSlug = slugifyValue(payload.campusSlug ?? payload.campusName);
    const normalizedMobile = normalizeMobile(payload.mobile);
    const normalizedEmail = normalizeOptionalEmail(payload.email);

    await this.assertInstitutionSlugAvailable(institutionSlug);

    const [systemAdminRole] = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.slug, ROLE_SLUGS.INSTITUTION_ADMIN),
          isNull(roles.institutionId),
        ),
      )
      .limit(1);

    if (!systemAdminRole) {
      throw new Error(
        "System role institution_admin not found. Ensure the seed service has run.",
      );
    }

    const created = await this.db.transaction(async (tx) => {
      const organizationId = randomUUID();
      const userId = randomUUID();
      const campusId = randomUUID();
      const membershipId = randomUUID();
      const membershipRoleId = randomUUID();

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
        primaryColor: DEFAULT_PRESET.primaryColor,
        accentColor: DEFAULT_PRESET.accentColor,
        sidebarColor: DEFAULT_PRESET.sidebarColor,
        status: STATUS.ORG.ACTIVE,
      });

      const passwordHash = await hash(payload.password, 12);
      await tx.insert(user).values({
        id: userId,
        institutionId: organizationId,
        name: payload.adminName.trim(),
        mobile: normalizedMobile,
        email: normalizedEmail,
        passwordHash,
        mustChangePassword: false,
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

      await tx.insert(membershipRoles).values({
        id: membershipRoleId,
        membershipId,
        roleId: systemAdminRole.id,
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
          institutionId: organizationId,
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
          ne(organization.status, STATUS.ORG.DELETED),
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
