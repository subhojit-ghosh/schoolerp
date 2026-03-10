import { SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/theme/mode-toggle";
import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

type TopBarProps = {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  searchPlaceholder?: string;
  status?: React.ReactNode;
};

export function TopBar({
  actions,
  children,
  searchPlaceholder = "Search the workspace",
  status,
}: TopBarProps) {
  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 px-4 md:px-6">
        <SidebarTrigger className="-ml-1 rounded-xl border border-transparent hover:border-border/60 hover:bg-background" />
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              className="h-10 w-full rounded-xl border border-border/60 bg-background/80 pl-9 pr-12 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-border focus:outline-none"
              readOnly
            />
            <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground">
              ⌘K
            </kbd>
          </div>
          {status}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-10 rounded-xl border-border/60 bg-background/80"
          >
            <Bell className="size-4" />
          </Button>
          <ModeToggle />
          {actions}
        </div>
      </header>
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto w-full max-w-[1400px]">
          {children}
        </div>
      </main>
    </>
  );
}
