import { useEffect, useState } from "react";
import { IconChevronDown, type Icon } from "@tabler/icons-react";
import { Link, useLocation } from "react-router";
import { cn } from "@repo/ui/lib/utils";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@repo/ui/components/ui/sidebar";

export function NavMain({
  collapsible = false,
  defaultExpanded = false,
  icon,
  items,
  label,
}: {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  icon?: Icon;
  items: {
    badgeLabel?: string;
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
  }[];
  label?: string;
}) {
  const GroupIcon = icon;
  const location = useLocation();

  function isActivePath(itemUrl: string) {
    return (
      location.pathname === itemUrl ||
      (itemUrl !== "/" && location.pathname.startsWith(`${itemUrl}/`))
    );
  }

  const storageKey = label ? `sidebar-group-${label}` : null;

  const hasActiveItem = items.some((item) => isActivePath(item.url));
  const [isExpanded, setIsExpanded] = useState(() => {
    if (!collapsible) return true;
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored !== null) return stored === "true";
    }
    return defaultExpanded || hasActiveItem;
  });

  useEffect(() => {
    if (hasActiveItem) {
      setIsExpanded(true);
    }
  }, [hasActiveItem]);

  function handleToggle() {
    setIsExpanded((prev) => {
      const next = !prev;
      if (storageKey) localStorage.setItem(storageKey, String(next));
      return next;
    });
  }

  return (
    <SidebarGroup className="py-0 pb-1.5">
      {label ? (
        collapsible ? (
          <button
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-2 py-1.5 transition-all duration-150",
              isExpanded
                ? "text-sidebar-foreground hover:bg-white/5"
                : "text-sidebar-foreground/80 hover:bg-white/5 hover:text-sidebar-foreground",
            )}
            onClick={handleToggle}
            type="button"
          >
            {GroupIcon ? (
              <span
                className={cn(
                  "flex size-[26px] shrink-0 items-center justify-center rounded-lg border transition-colors duration-150",
                  hasActiveItem
                    ? "border-[var(--accent)]/25 bg-[var(--accent)]/20 text-[var(--accent)]"
                    : isExpanded
                      ? "border-white/10 bg-white/10 text-sidebar-foreground/80"
                      : "border-white/10 bg-white/[0.07] text-sidebar-foreground/70",
                )}
              >
                <GroupIcon className="size-[14px]" />
              </span>
            ) : null}
            <span className="flex-1 text-left text-[13px] font-medium leading-none">
              {label}
            </span>
            <IconChevronDown
              className={cn(
                "size-3 shrink-0 opacity-40 transition-transform duration-200",
                !isExpanded && "-rotate-90",
              )}
            />
          </button>
        ) : (
          <SidebarGroupLabel className="flex items-center gap-2 px-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-sidebar-foreground/40">
            {GroupIcon ? <GroupIcon className="size-3.5 shrink-0" /> : null}
            {label}
          </SidebarGroupLabel>
        )
      ) : null}
      <SidebarGroupContent
        className={cn(collapsible && !isExpanded ? "hidden" : undefined)}
      >
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild={!item.disabled}
                isActive={isActivePath(item.url)}
                tooltip={item.title}
                className={cn(
                  "rounded-xl px-3 py-2.5 data-[active=true]:bg-white/10 data-[active=true]:font-medium data-[active=true]:shadow-[inset_2px_0_0_var(--accent)] hover:bg-white/6",
                  item.disabled
                    ? "cursor-not-allowed pointer-events-none text-muted-foreground/60"
                    : undefined,
                )}
              >
                {item.disabled ? (
                  <>
                    {item.icon ? <item.icon className="shrink-0" /> : null}
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="ml-auto text-[10px] font-medium tracking-wide text-muted-foreground/60 uppercase">
                      {item.badgeLabel ?? "Soon"}
                    </span>
                  </>
                ) : (
                  <Link to={item.url}>
                    {item.icon ? <item.icon /> : null}
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
