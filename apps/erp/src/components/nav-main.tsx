import type { Icon } from "@tabler/icons-react";
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
  items,
  label,
}: {
  items: {
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

  return (
    <SidebarGroup>
      {label ? (
        <SidebarGroupLabel className="px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sidebar-foreground/50">
          {label}
        </SidebarGroupLabel>
      ) : null}
      <SidebarGroupContent>
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
                      Soon
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
