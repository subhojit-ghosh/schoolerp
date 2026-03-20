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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@repo/ui/components/ui/sidebar";

const TOP_LEVEL_ROW_CLASS =
  "group/nav-section flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-sidebar-foreground/76 transition-all duration-150 hover:bg-white/[0.04] hover:text-sidebar-foreground";

const TOP_LEVEL_ICON_CLASS =
  "flex size-[26px] shrink-0 items-center justify-center rounded-md border transition-colors duration-150";

const TOP_LEVEL_TITLE_CLASS =
  "flex-1 text-left text-[13px] font-medium leading-none";

const ACTIVE_ROW_CLASS =
  "data-[active=true]:bg-white/[0.05] data-[active=true]:font-medium data-[active=true]:text-sidebar-foreground";

const ACTIVE_ICON_CLASS =
  "border-[var(--accent)]/25 bg-[var(--accent)]/20 text-[var(--accent)]";

const IDLE_ICON_CLASS =
  "border-white/10 bg-white/[0.07] text-sidebar-foreground/70";

export function NavMain({
  collapsible = false,
  defaultExpanded = false,
  icon,
  items,
  label,
  onOpenGroupChange,
  openGroupLabel,
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
  onOpenGroupChange?: (label: string | null) => void;
  openGroupLabel?: string | null;
}) {
  const GroupIcon = icon;
  const location = useLocation();

  function matchesPath(itemUrl: string) {
    return (
      location.pathname === itemUrl ||
      (itemUrl !== "/" && location.pathname.startsWith(`${itemUrl}/`))
    );
  }

  const activeItemUrl = items.reduce<string | null>((bestMatch, item) => {
    if (!matchesPath(item.url)) {
      return bestMatch;
    }

    if (bestMatch === null || item.url.length > bestMatch.length) {
      return item.url;
    }

    return bestMatch;
  }, null);

  function isActivePath(itemUrl: string) {
    return activeItemUrl === itemUrl;
  }

  const hasActiveItem = activeItemUrl !== null;
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || hasActiveItem);
  const isAccordionGroup = collapsible && Boolean(label) && onOpenGroupChange;
  const accordionExpanded = Boolean(label) && openGroupLabel === label;
  const resolvedExpanded = isAccordionGroup ? accordionExpanded : isExpanded;

  useEffect(() => {
    if (activeItemUrl) {
      if (label && onOpenGroupChange) {
        onOpenGroupChange(label);
        return;
      }

      setIsExpanded(true);
    }
  }, [activeItemUrl, label, onOpenGroupChange]);

  function handleToggle() {
    if (label && onOpenGroupChange) {
      onOpenGroupChange(resolvedExpanded ? null : label);
      return;
    }

    setIsExpanded((prev) => !prev);
  }

  return (
    <SidebarGroup className="py-0 pb-1.5">
      {label ? (
        collapsible ? (
          <button
            className={cn(
              TOP_LEVEL_ROW_CLASS,
              resolvedExpanded ? "text-sidebar-foreground" : undefined,
            )}
            onClick={handleToggle}
            type="button"
          >
            {GroupIcon ? (
              <span
                className={cn(
                  TOP_LEVEL_ICON_CLASS,
                  hasActiveItem
                    ? ACTIVE_ICON_CLASS
                    : resolvedExpanded
                      ? "border-white/10 bg-white/10 text-sidebar-foreground/80"
                      : IDLE_ICON_CLASS,
                )}
              >
                <GroupIcon className="size-[14px]" />
              </span>
            ) : null}
            <span className={TOP_LEVEL_TITLE_CLASS}>{label}</span>
            <IconChevronDown
              className={cn(
                "size-3 shrink-0 opacity-40 transition-transform duration-200 group-hover/nav-section:opacity-70",
                !resolvedExpanded && "-rotate-90",
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
        className={cn(
          collapsible
            ? "grid transition-[grid-template-rows,opacity] duration-200 ease-out motion-reduce:transition-none"
            : undefined,
          collapsible && resolvedExpanded
            ? "grid-rows-[1fr] opacity-100"
            : undefined,
          collapsible && !resolvedExpanded
            ? "grid-rows-[0fr] opacity-0"
            : undefined,
        )}
      >
        <div
          className={cn(
            collapsible ? "overflow-hidden" : undefined,
            collapsible
              ? "transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
              : undefined,
            collapsible && resolvedExpanded
              ? "translate-y-0 opacity-100"
              : undefined,
            collapsible && !resolvedExpanded
              ? "-translate-y-1 opacity-0 pointer-events-none"
              : undefined,
          )}
        >
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                {label ? (
                  <SidebarMenuSub className="mt-0.5 ml-5 mr-1 gap-0.5 border-l border-white/10 py-0.5 pl-2.5 pr-0">
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        asChild={!item.disabled}
                        isActive={isActivePath(item.url)}
                        className={cn(
                          "h-8 rounded-lg px-2.5 text-[13px] font-medium text-sidebar-foreground/72 transition-[background,color] duration-150 hover:bg-white/[0.04] hover:text-sidebar-foreground [&>svg]:size-[15px] [&>svg]:text-sidebar-foreground/55 data-[active=true]:[&>svg]:text-[var(--accent)]",
                          ACTIVE_ROW_CLASS,
                          item.disabled
                            ? "cursor-not-allowed pointer-events-none text-muted-foreground/60"
                            : undefined,
                        )}
                      >
                        {item.disabled ? (
                          <>
                            {item.icon ? (
                              <item.icon className="shrink-0" />
                            ) : null}
                            <span className="flex-1 truncate">
                              {item.title}
                            </span>
                            <span className="ml-auto rounded-md border border-white/8 bg-white/[0.05] px-1.5 py-0.5 text-[9px] font-semibold tracking-[0.14em] text-muted-foreground/65 uppercase">
                              {item.badgeLabel ?? "Soon"}
                            </span>
                          </>
                        ) : (
                          <Link to={item.url}>
                            {item.icon ? <item.icon /> : null}
                            <span>{item.title}</span>
                          </Link>
                        )}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                ) : (
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={isActivePath(item.url)}
                    tooltip={item.title}
                    className={cn(
                      TOP_LEVEL_ROW_CLASS,
                      "h-auto [&>svg]:hidden [&>a>svg]:hidden",
                      ACTIVE_ROW_CLASS,
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
                      <Link
                        className="flex w-full items-center gap-3"
                        to={item.url}
                      >
                        {item.icon ? (
                          <span
                            className={cn(
                              TOP_LEVEL_ICON_CLASS,
                              isActivePath(item.url)
                                ? ACTIVE_ICON_CLASS
                                : IDLE_ICON_CLASS,
                            )}
                          >
                            <item.icon className="size-[14px]" />
                          </span>
                        ) : null}
                        <span className={TOP_LEVEL_TITLE_CLASS}>{item.title}</span>
                        <span className="size-3 shrink-0 opacity-0" />
                      </Link>
                    )}
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
