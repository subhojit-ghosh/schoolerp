import { DATABASE } from "@repo/backend-core";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "@repo/contracts";
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import type { AppDatabase } from "@repo/database";
import {
  membershipRoles,
  permissions,
  rolePermissions,
  roles,
} from "@repo/database";
import { and, eq, isNull, or, isNotNull, count } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { AuthenticatedSession } from "../auth/auth.types";
import { AuditService } from "../audit/audit.service";
import type { CreateRoleDto, UpdateRoleDto } from "./roles.schemas";
import type { PermissionDto, RoleDto, RolePermissionDto } from "./roles.dto";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

@Injectable()
export class RolesService {
  constructor(
    @Inject(DATABASE) private readonly db: AppDatabase,
    private readonly auditService: AuditService,
  ) {}

  async listRoles(
    institutionId: string,
    _authSession: AuthenticatedSession,
  ): Promise<RoleDto[]> {
    const rows = await this.db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
        roleType: roles.roleType,
        isSystem: roles.isSystem,
        isConfigurable: roles.isConfigurable,
        permissionId: permissions.id,
        permissionSlug: permissions.slug,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          or(
            isNull(roles.institutionId),
            eq(roles.institutionId, institutionId),
          ),
        ),
      );

    return this.groupRoleRows(rows);
  }

  async getRole(
    institutionId: string,
    roleId: string,
    _authSession: AuthenticatedSession,
  ): Promise<RoleDto> {
    const rows = await this.db
      .select({
        roleId: roles.id,
        roleName: roles.name,
        roleSlug: roles.slug,
        roleType: roles.roleType,
        isSystem: roles.isSystem,
        isConfigurable: roles.isConfigurable,
        permissionId: permissions.id,
        permissionSlug: permissions.slug,
      })
      .from(roles)
      .leftJoin(rolePermissions, eq(rolePermissions.roleId, roles.id))
      .leftJoin(permissions, eq(permissions.id, rolePermissions.permissionId))
      .where(
        and(
          eq(roles.id, roleId),
          or(
            isNull(roles.institutionId),
            eq(roles.institutionId, institutionId),
          ),
        ),
      );

    const grouped = this.groupRoleRows(rows);
    if (grouped.length === 0) {
      throw new NotFoundException("Role not found");
    }
    return grouped[0];
  }

  async createRole(
    institutionId: string,
    authSession: AuthenticatedSession,
    data: CreateRoleDto,
  ): Promise<RoleDto> {
    const slug = slugify(data.name);

    // check slug uniqueness within institution
    const existing = await this.db
      .select({ id: roles.id })
      .from(roles)
      .where(
        and(
          eq(roles.slug, slug),
          eq(roles.institutionId, institutionId),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(
        "A role with this name already exists for this institution",
      );
    }

    // validate all permissionIds exist
    const foundPermissions = await this.db
      .select({ id: permissions.id })
      .from(permissions)
      .where(
        and(
          // We just fetch all and compare counts
          isNotNull(permissions.id),
        ),
      );

    const permissionIdSet = new Set(foundPermissions.map((p) => p.id));
    const invalid = data.permissionIds.filter((id) => !permissionIdSet.has(id));
    if (invalid.length > 0) {
      throw new UnprocessableEntityException(
        `Invalid permission IDs: ${invalid.join(", ")}`,
      );
    }

    const roleId = randomUUID();

    await this.db.transaction(async (tx) => {
      await tx.insert(roles).values({
        id: roleId,
        name: data.name,
        slug,
        roleType: "institution",
        institutionId,
        isSystem: false,
        isConfigurable: true,
      });

      if (data.permissionIds.length > 0) {
        await tx.insert(rolePermissions).values(
          data.permissionIds.map((permissionId) => ({
            roleId,
            permissionId,
          })),
        );
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.CREATE,
        entityType: AUDIT_ENTITY_TYPES.ROLE,
        entityId: roleId,
        entityLabel: data.name,
        summary: `Created role ${data.name}.`,
        metadata: {
          roleSlug: slug,
          permissionCount: data.permissionIds.length,
        },
      });
    });

    return this.getRole(institutionId, roleId, authSession);
  }

  async updateRole(
    institutionId: string,
    roleId: string,
    authSession: AuthenticatedSession,
    data: UpdateRoleDto,
  ): Promise<RoleDto> {
    const existingRole = await this.getRole(institutionId, roleId, authSession);
    const [role] = await this.db
      .select({ id: roles.id, isSystem: roles.isSystem })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.institutionId, institutionId)))
      .limit(1);

    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new ConflictException("System roles cannot be modified");
    }

    const nextRoleName = data.name ?? existingRole.name;
    const nextPermissionIds =
      data.permissionIds ?? existingRole.permissions.map((permission) => permission.id);

    await this.db.transaction(async (tx) => {
      if (data.name !== undefined) {
        await tx
          .update(roles)
          .set({ name: data.name })
          .where(eq(roles.id, roleId));
      }

      if (data.permissionIds !== undefined) {
        await tx
          .delete(rolePermissions)
          .where(eq(rolePermissions.roleId, roleId));

        if (data.permissionIds.length > 0) {
          await tx.insert(rolePermissions).values(
            data.permissionIds.map((permissionId) => ({
              roleId,
              permissionId,
            })),
          );
        }
      }

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.UPDATE,
        entityType: AUDIT_ENTITY_TYPES.ROLE,
        entityId: roleId,
        entityLabel: nextRoleName,
        summary: `Updated role ${nextRoleName}.`,
        metadata: {
          previousName: existingRole.name,
          nextName: nextRoleName,
          previousPermissionCount: existingRole.permissions.length,
          nextPermissionCount: nextPermissionIds.length,
        },
      });
    });

    return this.getRole(institutionId, roleId, authSession);
  }

  async deleteRole(
    institutionId: string,
    roleId: string,
    authSession: AuthenticatedSession,
  ): Promise<void> {
    const existingRole = await this.getRole(institutionId, roleId, authSession);
    const [role] = await this.db
      .select({ id: roles.id, isSystem: roles.isSystem })
      .from(roles)
      .where(and(eq(roles.id, roleId), eq(roles.institutionId, institutionId)))
      .limit(1);

    if (!role) {
      throw new NotFoundException("Role not found");
    }
    if (role.isSystem) {
      throw new ConflictException("System roles cannot be deleted");
    }

    const [{ activeCount }] = await this.db
      .select({ activeCount: count() })
      .from(membershipRoles)
      .where(
        and(
          eq(membershipRoles.roleId, roleId),
        ),
      );

    if (activeCount > 0) {
      throw new ConflictException(
        "Cannot delete a role that has staff assignments",
      );
    }

    await this.db.transaction(async (tx) => {
      await tx
        .delete(rolePermissions)
        .where(eq(rolePermissions.roleId, roleId));

      await this.auditService.recordInTransaction(tx, {
        institutionId,
        authSession,
        action: AUDIT_ACTIONS.DELETE,
        entityType: AUDIT_ENTITY_TYPES.ROLE,
        entityId: roleId,
        entityLabel: existingRole.name,
        summary: `Deleted role ${existingRole.name}.`,
        metadata: {
          permissionCount: existingRole.permissions.length,
        },
      });

      await tx.delete(roles).where(eq(roles.id, roleId));
    });
  }

  async listPermissions(): Promise<PermissionDto[]> {
    return this.db
      .select({ id: permissions.id, slug: permissions.slug })
      .from(permissions);
  }

  private groupRoleRows(
    rows: {
      roleId: string;
      roleName: string;
      roleSlug: string;
      roleType: string;
      isSystem: boolean;
      isConfigurable: boolean;
      permissionId: string | null;
      permissionSlug: string | null;
    }[],
  ): RoleDto[] {
    const roleMap = new Map<string, RoleDto>();

    for (const row of rows) {
      if (!roleMap.has(row.roleId)) {
        roleMap.set(row.roleId, {
          id: row.roleId,
          name: row.roleName,
          slug: row.roleSlug,
          roleType: row.roleType,
          isSystem: row.isSystem,
          isConfigurable: row.isConfigurable,
          permissions: [],
        });
      }
      if (row.permissionId && row.permissionSlug) {
        const perm: RolePermissionDto = {
          id: row.permissionId,
          slug: row.permissionSlug,
        };
        roleMap.get(row.roleId)!.permissions.push(perm);
      }
    }

    return Array.from(roleMap.values());
  }
}
