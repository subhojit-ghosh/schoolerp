import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  IconBuildingEstate,
  IconBell,
  IconCircleCheckFilled,
  IconMaximize,
  IconMinimize,
  IconSparkles,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@repo/ui/components/ui/dropdown-menu";
import { Input } from "@repo/ui/components/ui/input";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/ui/select";
import { cn } from "@repo/ui/lib/utils";
import { useSelectCampusMutation } from "@/features/auth/api/use-auth";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { ERP_ROUTES } from "@/constants/routes";
import {
  NOTIFICATION_UNREAD_COUNT,
  NOTIFICATION_UNREAD_ITEMS,
} from "@/features/notifications/model/notification-feed";
import { ThemeDrawer } from "@/features/settings/ui/theme-drawer";
import { ERP_TOAST_MESSAGES } from "@/lib/toast-messages";

const FULLSCREEN_CHANGE_EVENT = "fullscreenchange";
const WEBKIT_FULLSCREEN_CHANGE_EVENT = "webkitfullscreenchange";

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
  const session = useAuthStore((store) => store.session);
  const selectCampusMutation = useSelectCampusMutation();
  const [isFullscreen, setIsFullscreen] = useState(() =>
    Boolean(getFullscreenElement(document as FullscreenDocument)),
  );
  const [isScrolled, setIsScrolled] = useState(() =>
    typeof window !== "undefined" ? window.scrollY > 8 : false,
  );
  const campusName = session?.activeCampus?.name ?? "Campus";
  const campuses = session?.campuses ?? [];
  const showCampusSelector = isStaffContext(session);
  const fullscreenSupported = isFullscreenSupported(
    document as FullscreenDocument,
  );
  const notificationPreviewItems = NOTIFICATION_UNREAD_ITEMS.slice(0, 3);

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

      toast.error(ERP_TOAST_MESSAGES.fullscreenUnsupported);
    } catch {
      toast.error(ERP_TOAST_MESSAGES.fullscreenToggleFailed);
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
        </div>

        <div className="relative ml-4 hidden min-w-[260px] flex-1 md:block lg:max-w-md">
          <IconSearch className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full border-border/70 bg-card/80 pl-9 shadow-xs"
            placeholder="Search students, guardians, admission no..."
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label={`Open notifications (${NOTIFICATION_UNREAD_COUNT} unread)`}
                className="relative hidden h-10 w-10 rounded-full border border-border/70 bg-card/80 shadow-xs md:inline-flex"
                size="icon"
                variant="ghost"
              >
                <IconBell className="size-4" />
                {NOTIFICATION_UNREAD_COUNT > 0 ? (
                  <Badge className="absolute -top-1 -right-1 min-w-5 justify-center px-1 text-[10px]">
                    {NOTIFICATION_UNREAD_COUNT}
                  </Badge>
                ) : null}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-[min(92vw,24rem)] rounded-2xl border-border/70 p-0 shadow-xl"
              sideOffset={10}
            >
              <div className="border-b border-border/70 px-4 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold tracking-tight">
                      Notifications
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Quick look at new updates across academics and operations.
                    </p>
                  </div>
                  <Badge variant="outline">
                    {NOTIFICATION_UNREAD_COUNT} new
                  </Badge>
                </div>
              </div>

              <div className="max-h-[26rem] overflow-y-auto p-2">
                {notificationPreviewItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border/70 hover:bg-muted/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <item.Icon className="size-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">
                            {item.title}
                          </p>
                          {item.actionRequired ? (
                            <Badge variant="destructive">Action</Badge>
                          ) : null}
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {item.message}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span>{item.campus}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{item.relativeTime}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-border/70 p-3">
                <div className="flex items-center gap-2">
                  <Button className="h-9 flex-1 rounded-lg" variant="outline">
                    <IconCircleCheckFilled className="size-4" />
                    Mark all read
                  </Button>
                  <Button asChild className="h-9 flex-1 rounded-lg">
                    <Link to={ERP_ROUTES.NOTIFICATIONS}>
                      <IconSparkles className="size-4" />
                      Open notifications
                    </Link>
                  </Button>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

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
          <ThemeDrawer />
        </div>
      </div>
    </header>
  );
}
