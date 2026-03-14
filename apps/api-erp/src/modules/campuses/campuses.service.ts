import { DATABASE } from "@repo/backend-core";
import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import { campus } from "@repo/database";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuthService } from "../auth/auth.service";
import { slugifyValue } from "../auth/auth.utils";
import type { AuthenticatedSession } from "../auth/auth.types";
import type { CreateCampusDto } from "./campuses.schemas";

@Injectable()
export class CampusesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listCampuses(
    organizationId: string,
    authSession: AuthenticatedSession,
  ) {
    await this.requireInstitutionAccess(authSession, organizationId);

    return this.db
      .select({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        isDefault: campus.isDefault,
        status: campus.status,
      })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          isNull(campus.deletedAt),
        ),
      );
  }

  async createCampus(
    organizationId: string,
    authSession: AuthenticatedSession,
    payload: CreateCampusDto,
  ) {
    await this.requireInstitutionAccess(authSession, organizationId);

    const nextSlug = slugifyValue(payload.slug ?? payload.name);

    await this.assertCampusSlugAvailable(organizationId, nextSlug);

    const existingCampuses = await this.listCampuses(organizationId, authSession);
    const nextIsDefault = payload.isDefault ?? existingCampuses.length === 0;

    if (nextIsDefault) {
      await this.db
        .update(campus)
        .set({ isDefault: false })
        .where(eq(campus.organizationId, organizationId));
    }

    const [createdCampus] = await this.db
      .insert(campus)
      .values({
        id: randomUUID(),
        organizationId,
        name: payload.name.trim(),
        slug: nextSlug,
        code: payload.code ?? null,
        isDefault: nextIsDefault,
        status: STATUS.CAMPUS.ACTIVE,
      })
      .returning({
        id: campus.id,
        organizationId: campus.organizationId,
        name: campus.name,
        slug: campus.slug,
        code: campus.code,
        isDefault: campus.isDefault,
        status: campus.status,
      });

    return createdCampus;
  }

  private async assertCampusSlugAvailable(
    organizationId: string,
    slug: string,
  ) {
    const [existingCampus] = await this.db
      .select({ id: campus.id })
      .from(campus)
      .where(
        and(
          eq(campus.organizationId, organizationId),
          eq(campus.slug, slug),
          isNull(campus.deletedAt),
        ),
      )
      .limit(1);

    if (existingCampus) {
      throw new ConflictException(ERROR_MESSAGES.ONBOARDING.CAMPUS_SLUG_EXISTS);
    }
  }

  private async requireInstitutionAccess(
    authSession: AuthenticatedSession,
    institutionId: string,
  ) {
    await this.authService.requireOrganizationContext(
      authSession,
      institutionId,
      AUTH_CONTEXT_KEYS.STAFF,
    );
  }
}
