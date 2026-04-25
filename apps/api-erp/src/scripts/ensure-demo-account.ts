import { ROLE_SLUGS } from "@repo/contracts";
import {
  and,
  campus,
  campusMemberships,
  createDatabase,
  createPostgresClient,
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
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { MEMBER_TYPES, STATUS } from "../constants";
import { normalizeMobile } from "../modules/auth/auth.utils";

const SCRIPT_DIR = __dirname;
const API_APP_DIR = join(SCRIPT_DIR, "..", "..");
const LOCAL_ENV_PATH = join(API_APP_DIR, ".env.local");

const DEMO_ACCOUNT = {
  tenantSlug: "demo",
  name: "Demo Admin",
  mobile: "6291633219",
  password: "Password@01",
} as const;

function readEnvFileValue(key: string) {
  if (!existsSync(LOCAL_ENV_PATH)) {
    return undefined;
  }

  const lines = readFileSync(LOCAL_ENV_PATH, "utf8").split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const currentKey = line.slice(0, separatorIndex).trim();
    if (currentKey !== key) {
      continue;
    }

    return line.slice(separatorIndex + 1).trim();
  }

  return undefined;
}

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL ?? readEnvFileValue("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set and apps/api-erp/.env.local could not be read.");
  }

  return databaseUrl;
}

async function ensureDemoAccount() {
  const client = createPostgresClient(requireDatabaseUrl());
  const db = createDatabase(client);

  try {
    const normalizedMobile = normalizeMobile(DEMO_ACCOUNT.mobile);
    const passwordHash = await hash(DEMO_ACCOUNT.password, 12);

    const [matchedOrganization] = await db
      .select({
        id: organization.id,
        slug: organization.slug,
        name: organization.name,
      })
      .from(organization)
      .where(
        and(
          eq(organization.slug, DEMO_ACCOUNT.tenantSlug),
          ne(organization.status, STATUS.ORG.DELETED),
        ),
      )
      .limit(1);

    if (!matchedOrganization) {
      throw new Error(
        `Tenant "${DEMO_ACCOUNT.tenantSlug}" was not found. Start onboarding first or create the demo institution.`,
      );
    }

    const [defaultCampus] = await db
      .select({
        id: campus.id,
        name: campus.name,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, matchedOrganization.id),
          eq(campus.isDefault, true),
          ne(campus.status, STATUS.CAMPUS.DELETED),
        ),
      )
      .limit(1);

    if (!defaultCampus) {
      throw new Error(
        `Tenant "${DEMO_ACCOUNT.tenantSlug}" does not have an active default campus.`,
      );
    }

    const [institutionAdminRole] = await db
      .select({
        id: roles.id,
      })
      .from(roles)
      .where(
        and(eq(roles.slug, ROLE_SLUGS.INSTITUTION_ADMIN), isNull(roles.institutionId)),
      )
      .limit(1);

    if (!institutionAdminRole) {
      throw new Error(
        `System role "${ROLE_SLUGS.INSTITUTION_ADMIN}" was not found. Run the seed script first.`,
      );
    }

    const [existingUser] = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(
        and(
          eq(user.institutionId, matchedOrganization.id),
          eq(user.mobile, normalizedMobile),
        ),
      )
      .limit(1);

    const userId = existingUser?.id ?? randomUUID();

    if (existingUser) {
      await db
        .update(user)
        .set({
          name: DEMO_ACCOUNT.name,
          passwordHash,
          mustChangePassword: false,
          updatedAt: new Date(),
        })
        .where(eq(user.id, userId));
    } else {
      await db.insert(user).values({
        id: userId,
        institutionId: matchedOrganization.id,
        name: DEMO_ACCOUNT.name,
        mobile: normalizedMobile,
        email: null,
        passwordHash,
        mustChangePassword: false,
      });
    }

    const [existingMembership] = await db
      .select({
        id: member.id,
      })
      .from(member)
      .where(
        and(
          eq(member.organizationId, matchedOrganization.id),
          eq(member.userId, userId),
          eq(member.memberType, MEMBER_TYPES.STAFF),
          ne(member.status, STATUS.MEMBER.DELETED),
        ),
      )
      .limit(1);

    const membershipId = existingMembership?.id ?? randomUUID();

    if (existingMembership) {
      await db
        .update(member)
        .set({
          primaryCampusId: defaultCampus.id,
          status: STATUS.MEMBER.ACTIVE,
          deletedAt: null,
        })
        .where(eq(member.id, membershipId));
    } else {
      await db.insert(member).values({
        id: membershipId,
        organizationId: matchedOrganization.id,
        userId,
        primaryCampusId: defaultCampus.id,
        memberType: MEMBER_TYPES.STAFF,
        status: STATUS.MEMBER.ACTIVE,
      });
    }

    const [existingCampusMembership] = await db
      .select({
        id: campusMemberships.id,
      })
      .from(campusMemberships)
      .where(
        and(
          eq(campusMemberships.membershipId, membershipId),
          eq(campusMemberships.campusId, defaultCampus.id),
          isNull(campusMemberships.deletedAt),
        ),
      )
      .limit(1);

    if (!existingCampusMembership) {
      await db.insert(campusMemberships).values({
        id: randomUUID(),
        membershipId,
        campusId: defaultCampus.id,
      });
    }

    const [existingRoleAssignment] = await db
      .select({
        id: membershipRoles.id,
      })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.membershipId, membershipId),
          eq(membershipRoles.roleId, institutionAdminRole.id),
          isNull(membershipRoles.deletedAt),
        ),
      )
      .limit(1);

    if (!existingRoleAssignment) {
      await db.insert(membershipRoles).values({
        id: randomUUID(),
        membershipId,
        roleId: institutionAdminRole.id,
        validFrom: new Date().toISOString().slice(0, 10),
        validTo: null,
        academicYearId: null,
      });
    }

    console.log(
      `Demo account ready for tenant "${matchedOrganization.slug}" with mobile ${normalizedMobile}.`,
    );
  } finally {
    await client.end();
  }
}

void ensureDemoAccount().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
