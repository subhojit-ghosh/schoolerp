import { createSafeActionClient } from "next-safe-action";
import { ERROR_MESSAGES } from "@/constants";
import { AuthError } from "@/server/errors/auth-error";
import {
  getPlatformSessionUser,
  type PlatformSessionUser,
} from "@/server/auth/require-platform-super-admin";
import {
  requireOrgAccess,
  type OrgContext,
} from "@/server/auth/require-org-access";
import { getCurrentInstitution } from "@/server/institutions/get-current";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof AuthError) {
      return e.message;
    }

    console.error("[ActionError]", e);
    return ERROR_MESSAGES.COMMON.UNEXPECTED;
  },
});

export const superAdminAction = actionClient.use(async ({ next }) => {
  const user = await getPlatformSessionUser();
  if (!user?.isSuperAdmin) {
    throw AuthError.forbidden();
  }
  return next({ ctx: { user } });
});

export const orgAction = actionClient.use(async ({ next }) => {
  const institution = await getCurrentInstitution();
  const org = await requireOrgAccess(institution);

  return next({ ctx: { org } });
});

export type SafeActionContext = {
  user: PlatformSessionUser;
};

export type OrgSafeActionContext = {
  org: OrgContext;
};
