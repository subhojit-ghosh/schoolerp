import { useEffect, useState } from "react";
import { AUTH_CONTEXT_KEYS, type AuthContextKey } from "@repo/contracts";
import {
  IconBuildingEstate,
  IconBell,
  IconChevronDown,
  IconMaximize,
  IconMinimize,
  IconSchool,
  IconSearch,
  IconUserHeart,
  IconUserStar,
} from "@tabler/icons-react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import { Separator } from "@repo/ui/components/ui/separator";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { cn } from "@repo/ui/lib/utils";
import { ThemeDrawer } from "@/components/theme-drawer";
import { ModeToggle } from "@/components/mode-toggle";
import {
  useSelectCampusMutation,
  useSelectContextMutation,
} from "@/features/auth/api/use-auth";
import {
  getActiveContext,
  isStaffContext,
} from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/students": "Students",
  "/academic-years": "Academic Years",
  "/settings/branding": "Branding",
};

const FULLSCREEN_CHANGE_EVENT = "fullscreenchange";
const WEBKIT_FULLSCREEN_CHANGE_EVENT = "webkitfullscreenchange";

const CONTEXT_META: Record<
  AuthContextKey,
  {
    eyebrow: string;
    detail: string;
    Icon: typeof IconSchool;
  }
> = {
  [AUTH_CONTEXT_KEYS.STAFF]: {
    eyebrow: "Operations",
    detail: "Manage records, academics, and administration",
    Icon: IconSchool,
  },
  [AUTH_CONTEXT_KEYS.PARENT]: {
    eyebrow: "Family",
    detail: "Track children, notices, and school touchpoints",
    Icon: IconUserHeart,
  },
  [AUTH_CONTEXT_KEYS.STUDENT]: {
    eyebrow: "Learner",
    detail: "Follow classes, attendance, and outcomes",
    Icon: IconUserStar,
  },
};

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  webkitFullscreenEnabled?: boolean;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function getFullscreenElement(doc: FullscreenDocument) {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function isFullscreenSupported(doc: FullscreenDocument) {
  const root = doc.documentElement as FullscreenElement;

  return Boolean(
    doc.fullscreenEnabled ??
      doc.webkitFullscreenEnabled ??
      root.requestFullscreen ??
      root.webkitRequestFullscreen,
  );
}

export function SiteHeader() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const selectCampusMutation = useSelectCampusMutation();
  const selectContextMutation = useSelectContextMutation();
  const [isFullscreen, setIsFullscreen] = useState(() =>
    Boolean(getFullscreenElement(document as FullscreenDocument)),
  );
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 8 : false,
  );
  const title = location.pathname.startsWith("/students/")
    ? "Student"
    : PAGE_TITLES[location.pathname] ?? "ERP";
  const activeContext = getActiveContext(session);
  const campusName = session?.activeCampus?.name ?? "Campus";
  const campuses = session?.campuses ?? [];
  const availableContexts = session?.availableContexts ?? [];
  const showCampusSelector = isStaffContext(session);
  const activeContextMeta = activeContext
    ? CONTEXT_META[activeContext.key]
    : null;
  const fullscreenSupported = isFullscreenSupported(
    document as FullscreenDocument,
  );

  useEffect(() => {
    function handleFullscreenChange() {
      setIsFullscreen(
        Boolean(getFullscreenElement(document as FullscreenDocument)),
      );
    }

    document.addEventListener(FULLSCREEN_CHANGE_EVENT, handleFullscreenChange);
    document.addEventListener(
      WEBKIT_FULLSCREEN_CHANGE_EVENT,
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        FULLSCREEN_CHANGE_EVENT,
        handleFullscreenChange,
      );
      document.removeEventListener(
        WEBKIT_FULLSCREEN_CHANGE_EVENT,
        handleFullscreenChange,
      );
    };
  }, []);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 8);
    }

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  async function handleCampusChange(campusId: string) {
    await selectCampusMutation.mutateAsync({
      body: { campusId },
    });
  }

  async function handleContextChange(contextKey: AuthContextKey) {
    await selectContextMutation.mutateAsync({
      body: { contextKey },
    });
  }

  async function toggleFullscreen() {
    const fullscreenDocument = document as FullscreenDocument;
    const root = document.documentElement as FullscreenElement;

    try {
      if (getFullscreenElement(fullscreenDocument)) {
        if (fullscreenDocument.exitFullscreen) {
          await fullscreenDocument.exitFullscreen();
          return;
        }

        if (fullscreenDocument.webkitExitFullscreen) {
          await fullscreenDocument.webkitExitFullscreen();
          return;
        }
      }

      if (root.requestFullscreen) {
        await root.requestFullscreen();
        return;
      }

      if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
        return;
      }

      toast.error("Full screen is not supported in this browser.");
    } catch {
      toast.error("Unable to change full screen mode.");
    }
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-10 shrink-0 border-b backdrop-blur-2xl transition-[background-color,border-color,box-shadow] duration-200",
        isScrolled
          ? "border-border/60 bg-background/60 shadow-[0_14px_36px_-24px_rgba(15,23,42,0.32)] supports-[backdrop-filter]:bg-background/42"
          : "border-transparent bg-background/34 shadow-none supports-[backdrop-filter]:bg-background/26",
      )}
    >
      <div className="flex w-full items-center gap-3 px-4 py-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-1">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mx-2 data-[orientation=vertical]:h-4"
          />
          <h1 className="truncate text-lg font-semibold tracking-tight text-foreground">
            {title}
          </h1>
        </div>

        <div className="relative ml-4 hidden min-w-[260px] flex-1 md:block lg:max-w-md">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full border-border/70 bg-card/80 pl-9 shadow-xs"
            placeholder="Search students, guardians, admission no..."
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {availableContexts.length > 1 && activeContext && activeContextMeta ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-10 rounded-full border border-border/70 bg-card/80 px-4 text-sm shadow-xs hover:bg-card"
                  disabled={selectContextMutation.isPending}
                  variant="ghost"
                >
                  <activeContextMeta.Icon className="size-4 text-[var(--primary)]" />
                  <span>{activeContext.label}</span>
                  <IconChevronDown className="size-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-[380px] rounded-2xl border-border/70 p-2"
                sideOffset={10}
              >
                <div className="space-y-2">
                  {availableContexts.map((contextOption) => {
                    const meta = CONTEXT_META[contextOption.key];
                    const isActive = activeContext.key === contextOption.key;

                    return (
                      <button
                        key={contextOption.key}
                        className={cn(
                          "group relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left transition-all",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                          isActive
                            ? "border-transparent text-white shadow-lg"
                            : "border-border/70 bg-card text-foreground hover:border-primary/30 hover:bg-muted/20",
                        )}
                        disabled={selectContextMutation.isPending || isActive}
                        onClick={() => void handleContextChange(contextOption.key)}
                        type="button"
                      >
                        <div
                          className={cn(
                            "absolute inset-0 transition-opacity",
                            isActive
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100",
                          )}
                          style={{
                            background:
                              "linear-gradient(135deg, color-mix(in srgb, var(--primary) 92%, black 8%), color-mix(in srgb, var(--sidebar-primary, var(--primary)) 76%, black 24%))",
                          }}
                        />
                        <div className="relative flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p
                              className={cn(
                                "text-[11px] font-semibold uppercase tracking-[0.22em]",
                                isActive
                                  ? "text-white/70"
                                  : "text-muted-foreground/80",
                              )}
                            >
                              {meta.eyebrow}
                            </p>
                            <div className="flex items-center gap-2">
                              <meta.Icon
                                className={cn(
                                  "size-4",
                                  isActive
                                    ? "text-white"
                                    : "text-[var(--primary)]",
                                )}
                              />
                              <p className="text-base font-semibold tracking-tight">
                                {contextOption.label}
                              </p>
                            </div>
                            <p
                              className={cn(
                                "text-xs leading-relaxed",
                                isActive
                                  ? "text-white/80"
                                  : "text-muted-foreground",
                              )}
                            >
                              {meta.detail}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              "rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]",
                              isActive
                                ? "border-white/20 bg-white/12 text-white"
                                : "border-border/70 bg-background/80 text-muted-foreground",
                            )}
                            variant="outline"
                          >
                            {isActive ? "Current" : "Switch"}
                          </Badge>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          {showCampusSelector && campuses.length > 1 ? (
            <Select
              disabled={selectCampusMutation.isPending}
              onValueChange={(value) => void handleCampusChange(value)}
              value={session?.activeCampus?.id}
            >
              <SelectTrigger className="h-9 min-w-44 rounded-full border-border/70 bg-background/90 shadow-xs">
                <div className="flex items-center gap-2">
                  <IconBuildingEstate className="size-4 text-muted-foreground" />
                  <SelectValue placeholder={campusName} />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {campuses.map((campus) => (
                    <SelectItem key={campus.id} value={campus.id}>
                      {campus.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : showCampusSelector ? (
            <Badge
              className="h-9 rounded-full border-border/70 px-3 text-sm"
              variant="outline"
            >
              <IconBuildingEstate className="mr-1.5 size-3.5" />
              {campusName}
            </Badge>
          ) : null}

          <Button
            className="hidden h-10 w-10 rounded-full border border-border/70 bg-card/80 shadow-xs md:inline-flex"
            size="icon"
            variant="ghost"
          >
            <IconBell className="size-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            disabled={!fullscreenSupported}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            onClick={() => void toggleFullscreen()}
            title={isFullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullscreen ? (
              <IconMinimize className="size-4" />
            ) : (
              <IconMaximize className="size-4" />
            )}
          </Button>
          <ModeToggle />
          <ThemeDrawer />
        </div>
      </div>
    </header>
  );
}
