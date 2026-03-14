import { useEffect, useState } from "react";
import {
  IconBuildingEstate,
  IconBell,
  IconMaximize,
  IconMinimize,
  IconSearch,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
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
          <ThemeDrawer />
        </div>
      </div>
    </header>
  );
}
