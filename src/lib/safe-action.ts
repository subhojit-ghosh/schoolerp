import { createSafeActionClient } from "next-safe-action";
import { ERROR_MESSAGES } from "@/constants";
import { AuthError } from "@/server/errors/auth-error";
import {
  getPlatformSessionUser,
  type PlatformSessionUser,
} from "@/server/auth/require-platform-super-admin";

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

export type SafeActionContext = {
  user: PlatformSessionUser;
};
