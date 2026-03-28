import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { apiQueryClient } from "@/lib/api/client";
import { AUTH_API_PATHS } from "@/features/auth/api/auth.constants";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";

/** How often we check whether a warning or redirect is needed (ms). */
const CHECK_INTERVAL_MS = 60_000;

/** Idle time before showing the "session expiring" toast (ms). */
const WARNING_THRESHOLD_MS = 25 * 60_000;

/** Idle time before forcibly redirecting to sign-in (ms). */
const EXPIRY_THRESHOLD_MS = 30 * 60_000;

/** How often we proactively ping /auth/me to keep the session alive (ms). */
const HEALTH_CHECK_INTERVAL_MS = 5 * 60_000;

const SESSION_EXPIRY_TOAST_ID = "session-expiry-warning";

/**
 * Monitors session activity and warns the user before their session expires.
 *
 * Since auth uses HTTP-only cookies (unreadable from JS), expiry is inferred
 * from elapsed time since the last successful API interaction:
 *  - After 25 minutes idle, a toast warns the user.
 *  - After 30 minutes idle, the session is cleared and the user is redirected.
 *  - Every 5 minutes, /auth/me is polled; a 401 triggers immediate redirect.
 */
export function useSessionExpiryWarning(): void {
  const navigate = useNavigate();
  const clearSession = useAuthStore((store) => store.clearSession);
  const status = useAuthStore((store) => store.status);

  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  const sessionQuery = apiQueryClient.useQuery(
    "get",
    AUTH_API_PATHS.ME,
    undefined,
    {
      retry: false,
      enabled: status === "authenticated",
      refetchInterval: HEALTH_CHECK_INTERVAL_MS,
      refetchOnWindowFocus: true,
    },
  );

  const redirectToLogin = useCallback(() => {
    toast.dismiss(SESSION_EXPIRY_TOAST_ID);
    clearSession();
    void navigate(ERP_ROUTES.SIGN_IN, { replace: true });
  }, [clearSession, navigate]);

  const refreshSession = useCallback(() => {
    toast.dismiss(SESSION_EXPIRY_TOAST_ID);
    warningShownRef.current = false;
    lastActivityRef.current = Date.now();
    void sessionQuery.refetch();
  }, [sessionQuery]);

  // Reset the activity timer on user interaction events.
  useEffect(() => {
    function handleActivity() {
      lastActivityRef.current = Date.now();

      if (warningShownRef.current) {
        toast.dismiss(SESSION_EXPIRY_TOAST_ID);
        warningShownRef.current = false;
      }
    }

    window.addEventListener("click", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, []);

  // When the health-check query succeeds, treat it as fresh activity.
  useEffect(() => {
    if (sessionQuery.data) {
      lastActivityRef.current = Date.now();
    }
  }, [sessionQuery.data]);

  // If the health-check returns an error (401), redirect immediately.
  useEffect(() => {
    if (sessionQuery.error) {
      redirectToLogin();
    }
  }, [sessionQuery.error, redirectToLogin]);

  // Periodically check idle time and show warning or redirect.
  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(() => {
      const idle = Date.now() - lastActivityRef.current;

      if (idle >= EXPIRY_THRESHOLD_MS) {
        redirectToLogin();
        return;
      }

      if (idle >= WARNING_THRESHOLD_MS && !warningShownRef.current) {
        warningShownRef.current = true;
        toast.warning("Your session will expire soon.", {
          id: SESSION_EXPIRY_TOAST_ID,
          duration: Infinity,
          action: {
            label: "Stay logged in",
            onClick: refreshSession,
          },
        });
      }
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, redirectToLogin, refreshSession]);
}
