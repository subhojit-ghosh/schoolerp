import { useEffect, useState } from "react";
import { IconChevronDown, IconChevronRight, type Icon } from "@tabler/icons-react";
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
  defaultExpanded = true,
  items,
  label,
}: {
  collapsible?: boolean;
  defaultExpanded?: boolean;
  items: {
    badgeLabel?: string;
    title: string;
    url: string;
    icon?: Icon;
    disabled?: boolean;
  }[];
  label?: string;
}) {
  const location = useLocation();

  function isActivePath(itemUrl: string) {
    return (
      location.pathname === itemUrl ||
      (itemUrl !== "/" && location.pathname.startsWith(`${itemUrl}/`))
    );
  }

  const hasActiveItem = items.some((item) => isActivePath(item.url));
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || hasActiveItem);

  useEffect(() => {
    if (hasActiveItem) {
      setIsExpanded(true);
    }
  }, [hasActiveItem]);

  return (
    <SidebarGroup>
      {label ? (
        collapsible ? (
          <button
            className="flex w-full items-center gap-2 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50 transition-colors hover:text-sidebar-foreground/75"
            onClick={() => setIsExpanded((value) => !value)}
            type="button"
          >
            {isExpanded ? (
              <IconChevronDown className="size-3 shrink-0" />
            ) : (
              <IconChevronRight className="size-3 shrink-0" />
            )}
            <SidebarGroupLabel className="p-0 text-inherit">
              {label}
            </SidebarGroupLabel>
          </button>
        ) : (
          <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
            {label}
          </SidebarGroupLabel>
        )
      ) : null}
      <SidebarGroupContent className={cn(collapsible && !isExpanded ? "hidden" : undefined)}>
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
