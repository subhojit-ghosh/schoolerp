import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { ERP_ROUTES } from "@/constants/routes";
import { useSessionQuery } from "../api/use-auth";
import { useAuthStore } from "../model/auth-store";

/**
 * Wraps auth pages (sign-in, forgot-password, etc.) so that an
 * already-authenticated user is redirected to the dashboard instead
 * of seeing the login form again.
 */
export function RedirectIfAuthenticated({ children }: PropsWithChildren) {
  const { isLoading } = useSessionQuery();
  const status = useAuthStore((store) => store.status);

  if (isLoading || status === "unknown") {
    return null;
  }

  if (status === "authenticated") {
    return <Navigate replace to={ERP_ROUTES.DASHBOARD} />;
  }

  return children;
}
