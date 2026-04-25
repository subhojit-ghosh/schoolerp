import type { PropsWithChildren } from "react";
import { Navigate } from "react-router";
import { ERP_ROUTES } from "@/constants/routes";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
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
    return <AuthLoadingScreen />;
  }

  if (status === "authenticated") {
    return <Navigate replace to={ERP_ROUTES.DASHBOARD} />;
  }

  return children;
}

function AuthLoadingScreen() {
  const branding = readCachedTenantBranding();
  const initial = branding
    ? (branding.shortName ?? branding.institutionName).charAt(0).toUpperCase()
    : null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-background">
      <div className="relative flex items-center justify-center">
        <span
          className="absolute size-14 animate-ping rounded-xl opacity-20"
          style={{ background: "var(--primary)" }}
        />
        <span
          className="relative flex size-12 items-center justify-center rounded-xl text-lg font-bold"
          style={{
            background: initial ? "var(--primary)" : "transparent",
            color: "var(--primary-foreground)",
            boxShadow: initial ? "none" : undefined,
          }}
        >
          {initial ?? (
            <span
              className="size-8 rounded-full"
              style={{ background: "var(--primary)" }}
            />
          )}
        </span>
      </div>
      {branding?.institutionName ? (
        <p className="text-xs tracking-wide text-muted-foreground">
          {branding.institutionName}
        </p>
      ) : null}
    </div>
  );
}
