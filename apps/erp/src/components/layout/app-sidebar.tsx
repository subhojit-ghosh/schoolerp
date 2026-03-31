import * as React from "react";
import {
  AUTH_CONTEXT_KEYS,
  type AuthContextKey,
  type PermissionSlug,
} from "@repo/contracts";
import {
  IconCheck,
  IconChevronRight,
  IconMenu2,
  IconSchool,
  IconStar,
  IconStarFilled,
  IconX,
  IconUserHeart,
  IconUserStar,
  type Icon,
} from "@tabler/icons-react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui/components/ui/tooltip";
import { cn } from "@repo/ui/lib/utils";
import { useIsMobile } from "@repo/ui/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/ui/sheet";
import { useSelectContextMutation } from "@/features/auth/api/use-auth";
import {
  getContextSecondaryLabel,
  getActiveContext,
  hasPermission,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { readCachedTenantBranding } from "@/lib/tenant-branding";
import { ERP_ROUTES } from "@/constants/routes";
import { useSidebarFavorites } from "@/hooks/use-sidebar-favorites";
import {
  STAFF_MODULES,
  PARENT_MODULES,
  STUDENT_MODULES,
  findActiveModule,
  filterModuleByPermission,
  type NavModule,
} from "@/components/navigation/nav-modules";
import type { NavItem } from "@/components/navigation/nav-items";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RAIL_WIDTH = 64;
const FLYOUT_WIDTH = 252;
const SIDEBAR_RAIL_SURFACE =
  "linear-gradient(180deg, var(--sidebar-rail, color-mix(in srgb, var(--sidebar) 72%, black 28%)) 0%, color-mix(in srgb, var(--sidebar-rail, var(--sidebar)) 88%, black 12%) 100%)";

const CONTEXT_META: Record<
  AuthContextKey,
  { order: number; Icon: typeof IconSchool }
> = {
  [AUTH_CONTEXT_KEYS.STAFF]: { order: 1, Icon: IconSchool },
  [AUTH_CONTEXT_KEYS.PARENT]: { order: 2, Icon: IconUserHeart },
  [AUTH_CONTEXT_KEYS.STUDENT]: { order: 3, Icon: IconUserStar },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function InstitutionLogo({
  logoUrl,
  institutionName,
  initial,
}: {
  logoUrl: string | null;
  institutionName: string;
  initial: string;
}) {
  if (logoUrl) {
    return (
      <img
        alt={institutionName}
        className="size-8 shrink-0 rounded-[12px] object-contain ring-1 ring-white/10"
        src={logoUrl}
      />
    );
  }

  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-[10px] text-xs font-bold text-white"
      style={{
        background:
          "linear-gradient(160deg, var(--primary, #8a5a44) 0%, color-mix(in srgb, var(--primary, #8a5a44) 78%, black 22%) 100%)",
        boxShadow:
          "0 10px 20px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.22)",
      }}
    >
      {initial}
    </span>
  );
}

function FavoriteToggle({
  isFavorited,
  onToggle,
}: {
  isFavorited: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
      className={cn(
        "ml-auto flex size-5 shrink-0 items-center justify-center rounded transition-all duration-150",
        isFavorited
          ? "text-amber-400 opacity-100"
          : "text-foreground/65 opacity-0 hover:text-amber-400 focus-visible:opacity-100 group-hover/flyout-item:opacity-100 group-focus-within/flyout-item:opacity-100",
      )}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      type="button"
    >
      {isFavorited ? (
        <IconStarFilled className="size-3" />
      ) : (
        <IconStar className="size-3" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// RailIcon — single icon button in the rail
// ---------------------------------------------------------------------------

function RailIcon({
  icon: ItemIcon,
  label,
  isActive,
  onClick,
}: {
  icon: Icon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={label}
          className="group/rail-icon relative flex size-10 items-center justify-center rounded-[14px] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          onClick={onClick}
          style={{
            color: "rgba(255,255,255,0.96)",
            background: isActive
              ? "rgba(255,255,255,0.18)"
              : undefined,
            boxShadow: isActive
              ? "0 2px 8px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 1px rgba(255,255,255,0.12)"
              : undefined,
          }}
          type="button"
        >
          <ItemIcon
            className="size-[18px] transition-opacity duration-150 group-hover/rail-icon:opacity-100"
            style={{
              opacity: isActive ? 1 : 0.52,
            }}
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// FlyoutPanel — the expandable items panel
// ---------------------------------------------------------------------------

function FlyoutPanel({
  module,
  isFavorite,
  onToggleFavorite,
  onClose,
}: {
  module: NavModule;
  isFavorite: (url: string) => boolean;
  onToggleFavorite: (url: string) => void;
  onClose: () => void;
}) {
  const location = useLocation();

  const activeItemUrl = React.useMemo(() => {
    const allUrls = module.sections
      .flatMap((s) => s.items)
      .filter((item) => !item.disabled)
      .map((item) => item.url);
    const pathname = location.pathname;
    if (allUrls.includes(pathname)) return pathname;
    const prefixMatches = allUrls.filter(
      (url) => url !== "/" && pathname.startsWith(`${url}/`),
    );
    if (prefixMatches.length === 0) return null;
    return prefixMatches.reduce((best, url) =>
      url.length > best.length ? url : best,
    );
  }, [module.sections, location.pathname]);

  function isActivePath(itemUrl: string) {
    return activeItemUrl === itemUrl;
  }

  return (
    <aside
      className="flex h-full flex-col overflow-hidden"
      aria-label={`${module.label} navigation`}
      style={{
        color: "hsl(var(--foreground))",
        borderRight: "1px solid rgba(15,23,42,0.08)",
        background:
          "linear-gradient(180deg, oklch(0.965 0 0) 0%, oklch(0.97 0 0) 100%)",
      }}
    >
      <div className="border-b border-black/[0.06] px-4 pt-3.5 pb-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex size-9 shrink-0 items-center justify-center rounded-[18px]"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--sidebar-primary, var(--primary)) 12%, white 88%) 0%, color-mix(in srgb, var(--sidebar-primary, var(--primary)) 8%, white 92%) 100%)",
                color: "var(--sidebar-primary, var(--primary))",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.85), 0 6px 20px rgba(15,23,42,0.08)",
              }}
            >
              <module.icon className="size-[18px]" />
            </span>
            <div className="min-w-0">
              <h2
                className="truncate text-[17px] font-semibold tracking-[-0.025em]"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {module.label}
              </h2>
            </div>
          </div>
          <button
            aria-label={`Close ${module.label} navigation`}
            className="mt-0.5 flex size-7 items-center justify-center rounded-xl text-foreground/65 transition-colors hover:bg-black/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30"
            onClick={onClose}
            type="button"
          >
            <IconX className="size-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pt-2.5 pb-4">
        {module.sections.map((section, sectionIndex) => (
          <div key={section.label ?? sectionIndex} className="mb-3.5 last:mb-0">
            {section.label ? (
              <div className="mb-1.5 px-2.5 pt-2.5">
                <p
                  className="text-[9px] font-semibold uppercase tracking-[0.16em]"
                  style={{ opacity: 0.46 }}
                >
                  {section.label}
                </p>
              </div>
            ) : null}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.url}>
                  {item.disabled ? (
                    <span
                      className="flex h-[38px] w-full cursor-not-allowed items-center gap-2.5 rounded-xl border border-dashed px-3 text-[12.5px] font-medium tracking-[-0.01em]"
                      style={{
                        opacity: 0.42,
                        borderColor: "rgba(15,23,42,0.1)",
                        background: "rgba(255,255,255,0.35)",
                      }}
                    >
                      {item.icon ? (
                        <item.icon className="size-4 shrink-0" />
                      ) : null}
                      <span className="flex-1 truncate">{item.title}</span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.12em]"
                        style={{
                          opacity: 0.7,
                          background: "rgba(15,23,42,0.05)",
                          border: "1px solid rgba(15,23,42,0.06)",
                        }}
                      >
                        {item.badgeLabel ?? "Soon"}
                      </span>
                    </span>
                  ) : (
                    <Link
                      className={cn(
                        "group/flyout-item flex h-[38px] w-full items-center gap-2.5 rounded-xl text-[13px] font-medium tracking-[-0.012em] transition-all duration-150",
                        isActivePath(item.url)
                          ? "pl-[10px] pr-3"
                          : "px-3 hover:bg-black/[0.04]",
                      )}
                      style={{
                        color: "hsl(var(--foreground))",
                        background: isActivePath(item.url)
                          ? "color-mix(in srgb, var(--sidebar-primary, var(--primary)) 10%, white 90%)"
                          : undefined,
                        borderLeft: isActivePath(item.url)
                          ? "2px solid var(--sidebar-primary, var(--primary))"
                          : "2px solid transparent",
                        boxShadow: isActivePath(item.url)
                          ? "0 1px 4px rgba(15,23,42,0.07), inset 0 1px 0 rgba(255,255,255,0.8)"
                          : undefined,
                      }}
                      to={item.url}
                    >
                      {item.icon ? (
                        <item.icon
                          className="size-[15px] shrink-0"
                          style={{
                            color: isActivePath(item.url)
                              ? "var(--sidebar-primary, var(--primary))"
                              : "hsl(var(--muted-foreground))",
                            opacity: 1,
                          }}
                        />
                      ) : null}
                      <span className="flex-1 truncate">{item.title}</span>
                      <FavoriteToggle
                        isFavorited={isFavorite(item.url)}
                        onToggle={() => onToggleFavorite(item.url)}
                      />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// ContextSwitcher — dropdown for staff/parent/student
// ---------------------------------------------------------------------------

function ContextSwitcher({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const availableContexts = session?.availableContexts ?? [];
  const selectContextMutation = useSelectContextMutation();
  const [isOpen, setIsOpen] = React.useState(false);

  if (availableContexts.length <= 1 || !activeContext) {
    return null;
  }

  const sortedContexts = [...availableContexts].sort(
    (left, right) =>
      CONTEXT_META[left.key].order - CONTEXT_META[right.key].order,
  );

  const ActiveIcon = CONTEXT_META[activeContext.key].Icon;

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center justify-center rounded-lg transition-colors",
            compact ? "size-10" : "size-9",
          )}
          style={{
            color: "white",
            opacity: 0.72,
            background: "rgba(255,255,255,0.08)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          type="button"
        >
          <ActiveIcon className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-56 rounded-xl border border-border/70 bg-popover p-1 shadow-xl"
        side="right"
        sideOffset={8}
      >
        <div className="space-y-1">
          {sortedContexts.map((contextOption) => {
            const meta = CONTEXT_META[contextOption.key];
            const isActive = activeContext.key === contextOption.key;
            const contextSecondaryLabel = getContextSecondaryLabel(
              session,
              contextOption.key,
            );

            return (
              <button
                key={contextOption.key}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive
                    ? "border-transparent bg-[color-mix(in_srgb,var(--primary)_12%,white)] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]"
                    : "border-border/70 bg-card text-foreground hover:border-primary/20 hover:bg-muted/40",
                )}
                disabled={selectContextMutation.isPending || isActive}
                onClick={() => {
                  setIsOpen(false);
                  selectContextMutation.mutate(
                    { body: { contextKey: contextOption.key } },
                    { onSuccess: () => void navigate(ERP_ROUTES.DASHBOARD) },
                  );
                }}
                type="button"
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-xl border",
                    isActive
                      ? "border-transparent bg-primary text-primary-foreground"
                      : "border-border/70 bg-muted/50 text-primary",
                  )}
                >
                  <meta.Icon className="size-[18px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold tracking-[-0.01em]">
                    {contextOption.label}
                  </span>
                  {contextSecondaryLabel ? (
                    <span className="mt-0.5 block truncate font-mono text-[10.5px] font-medium tracking-[0.04em] text-muted-foreground/80">
                      {contextSecondaryLabel}
                    </span>
                  ) : null}
                </span>
                {isActive ? (
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background/95 text-primary">
                    <IconCheck className="size-3.5" />
                  </span>
                ) : (
                  <IconChevronRight className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground/70" />
                )}
              </button>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ---------------------------------------------------------------------------
// UserAvatar — rail footer
// ---------------------------------------------------------------------------

function UserAvatar() {
  const navigate = useNavigate();
  const session = useAuthStore((store) => store.session);
  const user = session?.user;

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          aria-label={`${user.name} account`}
          className="flex size-9 items-center justify-center rounded-[10px] text-[11px] font-bold tracking-wide transition-all duration-150"
          style={{
            color: "white",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.08) 100%)",
            boxShadow:
              "0 10px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
          onClick={() => void navigate(ERP_ROUTES.ACCOUNT)}
          type="button"
        >
          {initials}
        </button>
      </TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {user.name}
      </TooltipContent>
    </Tooltip>
  );
}

// ---------------------------------------------------------------------------
// FavoriteRailItems — shown at top of rail when favorites exist
// ---------------------------------------------------------------------------

function FavoriteRailItems({
  favorites,
  onNavigate,
}: {
  favorites: NavItem[];
  onNavigate: (url: string) => void;
}) {
  if (favorites.length === 0) return null;

  return (
    <>
      <div className="mt-3 mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/35">
        Fav
      </div>
      {favorites.map((item) => (
        <Tooltip key={item.url}>
          <TooltipTrigger asChild>
            <button
              aria-label={item.title}
              className="flex size-8 items-center justify-center rounded-xl text-amber-300/85 transition-colors hover:bg-white/[0.06] hover:text-amber-200"
              onClick={() => onNavigate(item.url)}
              type="button"
            >
              {item.icon ? (
                <item.icon className="size-[14px]" />
              ) : (
                <IconStarFilled className="size-3" />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" sideOffset={12}>
            {item.title}
          </TooltipContent>
        </Tooltip>
      ))}
      <div
        className="mx-auto my-2 h-px w-5"
        style={{ background: "rgba(255,255,255,0.12)" }}
      />
    </>
  );
}

// ---------------------------------------------------------------------------
// MobileSidebar — full-screen sheet for mobile
// ---------------------------------------------------------------------------

function MobileSidebar({
  modules,
  open,
  onOpenChange,
  logoProps,
  institutionName,
}: {
  modules: NavModule[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logoProps: {
    logoUrl: string | null;
    institutionName: string;
    initial: string;
  };
  institutionName: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const allModuleUrls = React.useMemo(
    () =>
      modules
        .flatMap((m) => m.sections.flatMap((s) => s.items))
        .filter((item) => !item.disabled)
        .map((item) => item.url),
    [modules],
  );

  const activeMobileUrl = React.useMemo(() => {
    const pathname = location.pathname;
    if (allModuleUrls.includes(pathname)) return pathname;
    const prefixMatches = allModuleUrls.filter(
      (url) => url !== "/" && pathname.startsWith(`${url}/`),
    );
    if (prefixMatches.length === 0) return null;
    return prefixMatches.reduce((best, url) =>
      url.length > best.length ? url : best,
    );
  }, [allModuleUrls, location.pathname]);

  function isActivePath(itemUrl: string) {
    return activeMobileUrl === itemUrl;
  }

  function handleNavigate(url: string) {
    onOpenChange(false);
    void navigate(url);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="w-[280px] bg-sidebar p-0 [&>[data-slot=sheet-close]]:right-3 [&>[data-slot=sheet-close]]:top-3 [&>[data-slot=sheet-close]]:rounded-lg [&>[data-slot=sheet-close]]:bg-white/8 [&>[data-slot=sheet-close]]:text-white [&>[data-slot=sheet-close]]:opacity-100 [&>[data-slot=sheet-close]]:ring-0 [&>[data-slot=sheet-close]]:hover:bg-white/14"
        style={{ color: "white" }}
        aria-describedby={undefined}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>School ERP navigation menu</SheetDescription>
        </SheetHeader>
        <div className="flex h-full flex-col">
          {/* Header */}
          <div
            className="flex items-center gap-3 px-4 py-4"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
          >
            <InstitutionLogo {...logoProps} />
            <p className="truncate text-sm font-semibold tracking-tight">
              {institutionName}
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {modules.map((mod) => (
              <div key={mod.key} className="mb-2">
                <p
                  className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
                  style={{ opacity: 0.4 }}
                >
                  {mod.label}
                </p>
                {mod.sections.map((section, si) => (
                  <div key={section.label ?? si}>
                    {section.label ? (
                      <p
                        className="mb-0.5 mt-2 px-2 text-[10px] font-medium uppercase tracking-[0.1em]"
                        style={{ opacity: 0.25 }}
                      >
                        {section.label}
                      </p>
                    ) : null}
                    {section.items.map((item) => (
                      <button
                        key={item.url}
                        className="flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition-all duration-100"
                        disabled={item.disabled}
                        onClick={() => handleNavigate(item.url)}
                        style={{
                          cursor: item.disabled ? "not-allowed" : undefined,
                          opacity: item.disabled
                            ? 0.25
                            : isActivePath(item.url)
                              ? 1
                              : 0.65,
                          background: isActivePath(item.url)
                            ? "rgba(255,255,255,0.1)"
                            : undefined,
                          borderLeft: isActivePath(item.url)
                            ? "2px solid var(--accent, #a78bfa)"
                            : "2px solid transparent",
                        }}
                        type="button"
                      >
                        {item.icon ? (
                          <item.icon
                            className="size-4 shrink-0"
                            style={{
                              color: isActivePath(item.url)
                                ? "var(--accent, #a78bfa)"
                                : undefined,
                            }}
                          />
                        ) : null}
                        <span className="flex-1 truncate text-left">
                          {item.title}
                        </span>
                        {item.disabled ? (
                          <span
                            className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]"
                            style={{
                              opacity: 0.6,
                              background: "rgba(255,255,255,0.06)",
                            }}
                          >
                            {item.badgeLabel ?? "Soon"}
                          </span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </nav>

          {/* Footer */}
          <div
            className="px-3 py-3"
            style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
          >
            <ContextSwitcher />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ---------------------------------------------------------------------------
// AppSidebar — main export
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const session = useAuthStore((store) => store.session);
  const activeContext = getActiveContext(session);
  const showStaffNavigation = isStaffContext(session);
  const { favorites, isFavorite, toggleFavorite } = useSidebarFavorites();
  const branding = readCachedTenantBranding();
  const institutionName =
    branding?.institutionName ??
    session?.activeOrganization?.name ??
    "School ERP";
  const logoUrl = branding?.logoUrl ?? null;
  const initial = (branding?.shortName ?? institutionName)
    .charAt(0)
    .toUpperCase();
  const logoProps = { logoUrl, institutionName, initial };

  // Filter by permission
  const modules = React.useMemo(() => {
    // Select the right module set based on context
    const rawModules = showStaffNavigation
      ? STAFF_MODULES
      : activeContext?.key === AUTH_CONTEXT_KEYS.PARENT
        ? PARENT_MODULES
        : activeContext?.key === AUTH_CONTEXT_KEYS.STUDENT
          ? STUDENT_MODULES
          : [];

    return rawModules
      .map((mod) =>
        filterModuleByPermission(mod, (perm: PermissionSlug) =>
          hasPermission(session, perm),
        ),
      )
      .filter((mod) => mod.sections.length > 0);
  }, [showStaffNavigation, activeContext?.key, session]);

  // Determine which module contains the current route
  const activeModule = React.useMemo(
    () => findActiveModule(location.pathname, modules),
    [location.pathname, modules],
  );

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openModuleKey, setOpenModuleKey] = React.useState<string | null>(
    activeModule?.directUrl ? null : (activeModule?.key ?? null),
  );

  // Keep the panel aligned with the current route so sibling navigation remains visible.
  React.useEffect(() => {
    setOpenModuleKey(
      activeModule?.directUrl ? null : (activeModule?.key ?? null),
    );
  }, [activeModule?.directUrl, activeModule?.key]);

  React.useEffect(() => {
    if (!openModuleKey) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenModuleKey(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openModuleKey]);

  // Favorite items resolved from URLs
  const favoriteNavItems = React.useMemo(() => {
    const allItems = modules.flatMap((m) => m.sections.flatMap((s) => s.items));
    return favorites
      .map((url) => allItems.find((item) => item.url === url))
      .filter((item): item is NavItem => item !== undefined && !item.disabled);
  }, [favorites, modules]);

  const openModule = modules.find((m) => m.key === openModuleKey) ?? null;
  const railActiveKey = openModuleKey ?? activeModule?.key ?? null;

  function handleRailClick(mod: NavModule) {
    if (mod.directUrl) {
      void navigate(mod.directUrl);
      setOpenModuleKey(null);
      return;
    }
    setOpenModuleKey((prev) => (prev === mod.key ? null : mod.key));
  }

  // ---- Mobile ----
  if (isMobile) {
    return (
      <>
        <button
          aria-label="Open navigation"
          className="fixed top-4 left-4 z-50 flex size-10 items-center justify-center rounded-lg border border-border/60 bg-background/80 shadow-sm backdrop-blur-md md:hidden"
          onClick={() => setMobileOpen(true)}
          type="button"
        >
          <IconMenu2 className="size-5" />
        </button>
        <MobileSidebar
          institutionName={institutionName}
          logoProps={logoProps}
          modules={modules}
          onOpenChange={setMobileOpen}
          open={mobileOpen}
        />
      </>
    );
  }

  // ---- Desktop / Tablet ----
  return (
    <TooltipProvider delayDuration={0}>
      <div
        className="print:hidden"
        style={{
          width: openModule ? RAIL_WIDTH + FLYOUT_WIDTH : RAIL_WIDTH,
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          flexShrink: 0,
        }}
      >
        <div
          className="fixed left-0 top-0 z-30 flex h-dvh"
          style={{ width: "inherit" }}
        >
          {/* ---- Icon Rail ---- */}
          <div
            className="relative z-10 flex h-full flex-col items-center py-3"
            style={{
              width: RAIL_WIDTH,
              background: SIDEBAR_RAIL_SURFACE,
              borderRight: "1px solid rgba(255,255,255,0.12)",
              boxShadow:
                "inset -1px 0 0 rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Logo */}
            <Link
              aria-label={`${institutionName} dashboard`}
              className="mb-3 flex size-10 items-center justify-center rounded-xl transition-all duration-150 hover:scale-105"
              to={ERP_ROUTES.DASHBOARD}
            >
              <InstitutionLogo {...logoProps} />
            </Link>

            {/* Context switcher (if multiple contexts) */}
            <ContextSwitcher compact />

            {/* Module icons */}
            <div className="mt-1 flex flex-1 flex-col items-center gap-1 overflow-y-auto">
              {modules.map((mod) => (
                <RailIcon
                  key={mod.key}
                  icon={mod.icon}
                  isActive={railActiveKey === mod.key}
                  label={mod.label}
                  onClick={() => handleRailClick(mod)}
                />
              ))}
            </div>

            {/* User avatar */}
            <div
              className="mt-auto flex w-full flex-col items-center gap-2 pt-2"
              style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
            >
              <FavoriteRailItems
                favorites={favoriteNavItems}
                onNavigate={(url) => {
                  setOpenModuleKey(null);
                  void navigate(url);
                }}
              />
              <UserAvatar />
            </div>
          </div>

          {/* ---- Flyout Panel ---- */}
          <div
            className={cn(
              "h-full overflow-hidden transition-[width,opacity] duration-220 ease-out",
              openModule ? "w-[252px] opacity-100" : "w-0 opacity-0",
            )}
            style={{
              background:
                "linear-gradient(180deg, oklch(0.965 0 0) 0%, oklch(0.97 0 0) 100%)",
              borderTop: "1px solid rgba(15,23,42,0.06)",
              borderRight: "1px solid rgba(15,23,42,0.08)",
              borderBottom: "1px solid rgba(15,23,42,0.08)",
              borderLeft: "1px solid rgba(15,23,42,0.14)",
              boxShadow:
                "18px 0 40px rgba(15,23,42,0.06), inset -1px 0 0 rgba(15,23,42,0.08)",
              transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            {openModule ? (
              <FlyoutPanel
                isFavorite={isFavorite}
                module={openModule}
                onClose={() => setOpenModuleKey(null)}
                onToggleFavorite={toggleFavorite}
              />
            ) : null}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
