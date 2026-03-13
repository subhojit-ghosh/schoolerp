import { AUTH_CONTEXT_KEYS } from "@repo/contracts";
import type { AuthSession } from "./auth.types";

export function getActiveContext(session: AuthSession | null) {
  return session?.activeContext ?? null;
}

export function isStaffContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.STAFF;
}

export function isParentContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.PARENT;
}

export function isStudentContext(session: AuthSession | null) {
  return getActiveContext(session)?.key === AUTH_CONTEXT_KEYS.STUDENT;
}
