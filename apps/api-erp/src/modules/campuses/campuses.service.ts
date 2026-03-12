import { DATABASE } from "@academic-platform/backend-core";
import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import type { AppDatabase } from "@academic-platform/database";
import { campus } from "@academic-platform/database";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { ERROR_MESSAGES, STATUS } from "../../constants";
import { AuthService } from "../auth/auth.service";
import { slugifyValue } from "../auth/auth.utils";
import type { CreateCampusDto } from "./campuses.schemas";

@Injectable()
export class CampusesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly authService: AuthService,
  ) {}

  async listCampuses(organizationId: string) {
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
    userId: string,
    payload: CreateCampusDto,
  ) {
    const membership = await this.authService.getMembershipForOrganization(
      userId,
      organizationId,
    );

    if (!membership) {
      throw new NotFoundException(ERROR_MESSAGES.AUTH.MEMBERSHIP_REQUIRED);
    }

    const existingCampuses = await this.listCampuses(organizationId);
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
        slug: slugifyValue(payload.slug ?? payload.name),
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
}
