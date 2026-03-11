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
      <header className="flex h-14 shrink-0 items-center gap-2.5 px-5 py-2">
        {/* Menu / sidebar trigger */}
        <SidebarTrigger className="flex size-[42px] shrink-0 items-center justify-center rounded-xl bg-accent text-muted-foreground hover:bg-accent/80" />

        {/* Breadcrumb pill */}
        {breadcrumbs.length > 0 && (
          <div className="flex h-[42px] shrink-0 items-center gap-2.5 rounded-xl border border-border bg-muted px-4">
            {breadcrumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-2.5">
                {i > 0 && (
                  <span className="size-1 rounded-full bg-muted-foreground/50" />
                )}
                <span className="text-[15px] text-muted-foreground">{crumb}</span>
              </span>
            ))}
          </div>
        )}

        {/* Search bar — fills remaining space */}
        <div className="relative flex h-[42px] min-w-0 flex-1 items-center rounded-xl border border-border bg-card px-5">
          <Search className="mr-2.5 size-4 shrink-0 text-muted-foreground" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            className="h-full w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            readOnly
          />
          <kbd className="pointer-events-none ml-2 hidden shrink-0 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[0.625rem] text-muted-foreground lg:inline-block">
            ⌘K
          </kbd>
        </div>

        {/* Status chip */}
        {status && (
          <div className="hidden h-10 shrink-0 items-center justify-center rounded-xl border border-border bg-accent px-4 font-cap text-xs font-medium uppercase tracking-[0.15em] text-accent-foreground lg:flex">
            {status}
          </div>
        )}

        {/* Help button */}
        <button
          type="button"
          className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-card text-secondary-foreground hover:bg-accent"
        >
          <HelpCircle className="size-4" />
        </button>

        {/* Notification button */}
        <button
          type="button"
          className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-card text-secondary-foreground hover:bg-accent"
        >
          <Bell className="size-4" />
        </button>

        {/* Date pill */}
        <div className="hidden h-[42px] shrink-0 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm text-muted-foreground lg:flex">
          {formatDate()}
        </div>

        {/* User actions (profile dropdown) */}
        {actions}
      </header>

      <main className="flex-1 px-5 pb-5">
        {children}
      </main>
    </>
  );
}
