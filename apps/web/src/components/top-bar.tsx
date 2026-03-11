import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, HelpCircle, Search } from "lucide-react";

type TopBarProps = {
  actions?: React.ReactNode;
  children?: React.ReactNode;
  breadcrumbs?: string[];
  searchPlaceholder?: string;
  status?: string;
};

function formatDate() {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "long" });
  const date = now.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  return `${day}, ${date}`;
}

export function TopBar({
  actions,
  children,
  breadcrumbs = [],
  searchPlaceholder = "Search the workspace",
  status,
}: TopBarProps) {
  return (
    <>
      <header className="flex shrink-0 items-center gap-2.5 border-b border-border/70 px-4 py-2.5">
        <SidebarTrigger className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[var(--shell-elevated)] text-muted-foreground hover:bg-accent" />

        {breadcrumbs.length > 0 && (
          <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb} className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                {i > 0 && (
                  <span className="size-1 rounded-full bg-muted-foreground/50" />
                )}
                <span>{crumb}</span>
              </span>
            ))}
          </div>
        )}

        <div className="relative flex h-9 min-w-0 flex-1 items-center rounded-2xl border border-border/70 bg-[var(--shell-elevated)] px-3.5">
          <Search className="mr-2 size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            readOnly
          />
          <kbd className="pointer-events-none ml-2 hidden shrink-0 rounded-md border border-border/70 bg-background/80 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground lg:inline-block">
            ⌘K
          </kbd>
        </div>

        {status && (
          <div className="hidden h-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-background/80 px-3.5 font-cap text-[0.625rem] font-medium uppercase tracking-[0.16em] text-secondary-foreground xl:flex">
            {status}
          </div>
        )}

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[var(--shell-elevated)] text-secondary-foreground hover:bg-accent"
        >
          <HelpCircle className="size-4" />
        </button>

        <button
          type="button"
          className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-[var(--shell-elevated)] text-secondary-foreground hover:bg-accent"
        >
          <Bell className="size-4" />
        </button>

        <div className="hidden shrink-0 items-center justify-center px-2 text-sm text-muted-foreground xl:flex">
          {formatDate()}
        </div>

        {actions}
      </header>

      <main className="flex-1 px-4 py-3">
        {children}
      </main>
    </>
  );
}
