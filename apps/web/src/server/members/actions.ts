"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { returnValidationErrors } from "next-safe-action";
import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { membershipRoles, roles } from "@/db/schema";
import { member, user } from "@/db/schema/auth";
import { ERROR_MESSAGES, PERMISSIONS, ROLES, ROUTES, STATUS } from "@/constants";
import { auth } from "@/lib/auth";
import { orgAction } from "@/lib/safe-action";
import { assertPermission } from "@/server/auth/require-org-access";
import { AuthError } from "@/server/errors/auth-error";
import { createMemberFormSchema, createMemberSchema, memberIdSchema, updateMemberRoleSchema } from "./schemas";

function revalidateMembersRoute() {
  revalidatePath(ROUTES.ORG.MEMBERS);
}

function currentDateString() {
  return new Date().toISOString().slice(0, 10);
}

async function getAssignableRole(roleId: string, institutionId: string) {
  const [roleRow] = await db
    .select({
      id: roles.id,
      slug: roles.slug,
      institutionId: roles.institutionId,
    })
    .from(roles)
    .where(and(eq(roles.id, roleId), isNull(roles.deletedAt)))
    .limit(1);

  if (
    !roleRow ||
    (roleRow.institutionId !== null && roleRow.institutionId !== institutionId) ||
    roleRow.slug === ROLES.SUPER_ADMIN
  ) {
    return null;
  }

  return roleRow;
}

async function getMemberForUpdate(memberId: string, institutionId: string) {
  const [target] = await db
    .select({
      id: member.id,
      role: member.role,
      status: member.status,
      deletedAt: member.deletedAt,
    })
    .from(member)
    .where(
      and(
        eq(member.id, memberId),
        eq(member.organizationId, institutionId),
      ),
    )
    .limit(1);

  if (!target || target.deletedAt !== null) {
    throw AuthError.forbidden();
  }

  return target;
}

async function ensureAdminCoverage(
  institutionId: string,
  target: { role: string; status: string },
  nextState: { role: string; status: string; deleted: boolean },
) {
  const targetIsActiveAdmin =
    target.role === ROLES.INSTITUTION_ADMIN &&
    target.status === STATUS.MEMBER.ACTIVE;
  const remainsActiveAdmin =
    nextState.role === ROLES.INSTITUTION_ADMIN &&
    nextState.status === STATUS.MEMBER.ACTIVE &&
    nextState.deleted === false;

  if (!targetIsActiveAdmin || remainsActiveAdmin) {
    return;
  }

  const [adminCount] = await db
    .select({ count: count() })
    .from(member)
    .where(
      and(
        eq(member.organizationId, institutionId),
        eq(member.role, ROLES.INSTITUTION_ADMIN),
        eq(member.status, STATUS.MEMBER.ACTIVE),
        isNull(member.deletedAt),
      ),
    );

  if ((adminCount?.count ?? 0) <= 1) {
    throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.LAST_ADMIN_REQUIRED);
  }
}

const memberManagementAction = orgAction.use(async ({ next, ctx }) => {
  assertPermission(ctx.org, PERMISSIONS.MEMBERS.INVITE);
  return next({ ctx });
});

export const createMember = memberManagementAction
  .inputSchema(createMemberFormSchema)
  .stateAction(async ({ parsedInput, ctx }) => {
    const role = await getAssignableRole(parsedInput.roleId, ctx.org.institution.id);
    if (!role) {
      returnValidationErrors(z.object({ roleId: z.string() }), {
        roleId: { _errors: [ERROR_MESSAGES.MEMBERS.ROLE_NOT_FOUND] },
      });
    }

    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, parsedInput.email))
      .limit(1);

    const userId = await (async () => {
      if (existingUser) {
        return existingUser.id;
      }

      const result = await auth.api.signUpEmail({
        body: {
          name: parsedInput.name,
          email: parsedInput.email,
          password: parsedInput.password,
        },
      });

      return result.user.id;
    })();

    const [existingMember] = await db
      .select({ id: member.id })
      .from(member)
      .where(
        and(
          eq(member.organizationId, ctx.org.institution.id),
          eq(member.userId, userId),
          isNull(member.deletedAt),
        ),
      )
      .limit(1);

    if (existingMember) {
      returnValidationErrors(z.object({ email: createMemberSchema.shape.email }), {
        email: { _errors: [ERROR_MESSAGES.MEMBERS.EMAIL_ALREADY_EXISTS] },
      });
    }

    const memberId = crypto.randomUUID();
    await db.insert(member).values({
      id: memberId,
      organizationId: ctx.org.institution.id,
      userId,
      role: role!.slug,
      status: STATUS.MEMBER.ACTIVE,
      createdAt: new Date(),
    });

    await db.insert(membershipRoles).values({
      id: crypto.randomUUID(),
      membershipId: memberId,
      roleId: role!.id,
      validFrom: currentDateString(),
    });

    revalidateMembersRoute();
  });

export const suspendMember = memberManagementAction
  .inputSchema(memberIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.memberId === ctx.org.membershipId) {
      throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.CANNOT_MODIFY_SELF);
    }

    const target = await getMemberForUpdate(parsedInput.memberId, ctx.org.institution.id);
    await ensureAdminCoverage(ctx.org.institution.id, target, {
      role: target.role,
      status: STATUS.MEMBER.SUSPENDED,
      deleted: false,
    });

    await db
      .update(member)
      .set({ status: STATUS.MEMBER.SUSPENDED })
      .where(eq(member.id, parsedInput.memberId));

    revalidateMembersRoute();
  });

export const restoreMember = memberManagementAction
  .inputSchema(memberIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.memberId === ctx.org.membershipId) {
      throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.CANNOT_MODIFY_SELF);
    }

    await getMemberForUpdate(parsedInput.memberId, ctx.org.institution.id);

    await db
      .update(member)
      .set({ status: STATUS.MEMBER.ACTIVE })
      .where(eq(member.id, parsedInput.memberId));

    revalidateMembersRoute();
  });

export const removeMember = memberManagementAction
  .inputSchema(memberIdSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.memberId === ctx.org.membershipId) {
      throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.CANNOT_MODIFY_SELF);
    }

    const target = await getMemberForUpdate(parsedInput.memberId, ctx.org.institution.id);
    await ensureAdminCoverage(ctx.org.institution.id, target, {
      role: target.role,
      status: target.status,
      deleted: true,
    });

    await db
      .update(member)
      .set({ deletedAt: new Date() })
      .where(eq(member.id, parsedInput.memberId));

    await db
      .update(membershipRoles)
      .set({
        validTo: currentDateString(),
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(membershipRoles.membershipId, parsedInput.memberId),
          isNull(membershipRoles.deletedAt),
        ),
      );

    revalidateMembersRoute();
  });

export const updateMemberRole = memberManagementAction
  .inputSchema(updateMemberRoleSchema)
  .action(async ({ parsedInput, ctx }) => {
    if (parsedInput.memberId === ctx.org.membershipId) {
      throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.CANNOT_MODIFY_SELF);
    }

    const nextRole = await getAssignableRole(parsedInput.roleId, ctx.org.institution.id);
    if (!nextRole) {
      throw AuthError.forbidden(ERROR_MESSAGES.MEMBERS.ROLE_NOT_FOUND);
    }

    const target = await getMemberForUpdate(parsedInput.memberId, ctx.org.institution.id);
    await ensureAdminCoverage(ctx.org.institution.id, target, {
      role: nextRole.slug,
      status: target.status,
      deleted: false,
    });

    await db
      .update(membershipRoles)
      .set({
        validTo: currentDateString(),
        deletedAt: new Date(),
      })
      .where(
        and(
          eq(membershipRoles.membershipId, parsedInput.memberId),
          isNull(membershipRoles.deletedAt),
          isNull(membershipRoles.validTo),
        ),
      );

    await db.insert(membershipRoles).values({
      id: crypto.randomUUID(),
      membershipId: parsedInput.memberId,
      roleId: nextRole.id,
      validFrom: currentDateString(),
    });

    await db
      .update(member)
      .set({ role: nextRole.slug })
      .where(eq(member.id, parsedInput.memberId));

    revalidateMembersRoute();
  });
