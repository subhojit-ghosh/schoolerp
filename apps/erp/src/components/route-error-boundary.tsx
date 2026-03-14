import {
  IconAlertTriangle,
  IconArrowLeft,
  IconBuildingEstate,
  IconRefresh,
} from "@tabler/icons-react";
import { isRouteErrorResponse, useNavigate, useRouteError } from "react-router";
import { Button } from "@repo/ui/components/ui/button";
import { ERP_ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { readCachedTenantBranding } from "@/lib/tenant-branding";

const FALLBACK_COPY = {
  TITLE: "This workspace hit a runtime fault",
  DESCRIPTION:
    "The page failed while loading the current ERP view. Your session is still intact, and you can retry or move to a stable area.",
  STATUS_PREFIX: "Status",
  DEFAULT_STATUS: "Application error",
  BACK_LABEL: "Go back",
  RELOAD_LABEL: "Reload page",
  DASHBOARD_LABEL: "Open dashboard",
  SIGN_IN_LABEL: "Open sign in",
  SUPPORT_LABEL: "What happened",
};

function getErrorSummary(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return {
      heading: `${FALLBACK_COPY.STATUS_PREFIX} ${error.status}`,
      detail: error.statusText || FALLBACK_COPY.DEFAULT_STATUS,
    };
  }

  if (error instanceof Error) {
    return {
      heading: FALLBACK_COPY.DEFAULT_STATUS,
      detail: error.message,
    };
  }

  return {
    heading: FALLBACK_COPY.DEFAULT_STATUS,
    detail: FALLBACK_COPY.DESCRIPTION,
  };
}

export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const status = useAuthStore((store) => store.status);
  const branding = readCachedTenantBranding();
  const institutionName = branding?.institutionName ?? "School ERP";
  const shortName = branding?.shortName ?? "ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = shortName.charAt(0).toUpperCase();
  const summary = getErrorSummary(error);
  const primaryAction =
    status === "authenticated" ? ERP_ROUTES.DASHBOARD : ERP_ROUTES.SIGN_IN;
  const primaryLabel =
    status === "authenticated"
      ? FALLBACK_COPY.DASHBOARD_LABEL
      : FALLBACK_COPY.SIGN_IN_LABEL;

  return (
    <div className="relative flex min-h-svh overflow-hidden bg-[linear-gradient(160deg,hsl(var(--background))_0%,color-mix(in_srgb,var(--primary)_10%,hsl(var(--background))_90%)_100%)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_srgb,var(--accent)_24%,transparent),transparent_36%),radial-gradient(circle_at_bottom_right,color-mix(in_srgb,var(--primary)_24%,transparent),transparent_34%)]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--border)_68%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--border)_68%,transparent)_1px,transparent_1px)] [background-size:54px_54px]" />

      <div className="relative z-10 flex w-full items-center justify-center px-6 py-10 lg:px-10">
        <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-sidebar px-7 py-8 text-sidebar-foreground shadow-2xl shadow-black/15 lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--sidebar-accent)_38%,transparent),transparent_44%)]" />
            <div className="relative space-y-10">
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img
                    alt={institutionName}
                    className="h-11 w-auto max-w-32 object-contain"
                    src={logoUrl}
                  />
                ) : (
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-sidebar-accent text-sm font-semibold text-sidebar-accent-foreground">
                    {initial}
                  </div>
                )}
                <div className="space-y-1">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-sidebar-foreground/55">
                    {institutionName}
                  </p>
                  <div className="flex items-center gap-2 text-sidebar-foreground/80">
                    <IconBuildingEstate className="size-4" />
                    <span className="text-sm">ERP Workspace Recovery</span>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-sidebar-foreground/70">
                  <IconAlertTriangle className="size-3.5" />
                  {summary.heading}
                </div>
                <div className="space-y-4">
                  <h1 className="max-w-xl text-4xl font-semibold tracking-tight text-balance lg:text-5xl">
                    {FALLBACK_COPY.TITLE}
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-sidebar-foreground/72 lg:text-base">
                    {FALLBACK_COPY.DESCRIPTION}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-sidebar-foreground/74 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/50">
                    {FALLBACK_COPY.SUPPORT_LABEL}
                  </p>
                  <p className="leading-6">{summary.detail}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
                  <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-sidebar-foreground/50">
                    Recovery path
                  </p>
                  <p className="leading-6">
                    Retry the current page first. If the issue persists, move
                    back to a stable route and continue from there.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/88 p-6 shadow-xl backdrop-blur xl:p-8">
            <div className="absolute inset-x-10 top-0 h-24 rounded-full bg-[color-mix(in_srgb,var(--primary)_14%,transparent)] blur-3xl" />
            <div className="relative flex h-full flex-col justify-between gap-8">
              <div className="space-y-3">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground">
                  Recovery controls
                </p>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight">
                    Keep the session moving
                  </h2>
                  <p className="text-sm leading-6 text-muted-foreground">
                    The fallback keeps the tenant branding, preserves navigation
                    context, and gives staff a clear next step instead of a raw
                    framework stack trace.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  className="h-11 w-full justify-center rounded-full"
                  onClick={() => void navigate(primaryAction)}
                  size="lg"
                >
                  {primaryLabel}
                </Button>
                <Button
                  className="h-11 w-full justify-center rounded-full"
                  onClick={() => window.location.reload()}
                  size="lg"
                  variant="outline"
                >
                  <IconRefresh className="size-4" />
                  {FALLBACK_COPY.RELOAD_LABEL}
                </Button>
                <Button
                  className="h-11 w-full justify-center rounded-full"
                  onClick={() => navigate(-1)}
                  size="lg"
                  variant="ghost"
                >
                  <IconArrowLeft className="size-4" />
                  {FALLBACK_COPY.BACK_LABEL}
                </Button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
