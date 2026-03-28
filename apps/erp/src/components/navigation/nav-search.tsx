import * as React from "react";
import { type Icon, IconClock } from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { useRecentPages } from "@/hooks/use-recent-pages";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@repo/ui/components/ui/command";

type NavSearchItem = {
  icon?: Icon;
  title: string;
  url: string;
};

type NavSearchGroup = {
  label: string;
  items: NavSearchItem[];
};

export function NavSearch({
  groups,
  open,
  onOpenChange,
}: {
  groups: NavSearchGroup[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { recentPages } = useRecentPages();
  const recentPagesToShow = recentPages.slice(0, 5);

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        onOpenChange(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onOpenChange]);

  function handleSelect(url: string) {
    onOpenChange(false);
    void navigate(url);
  }

  const navGroups = groups.filter((g) => g.label !== "Quick Actions");
  const actionGroups = groups.filter((g) => g.label === "Quick Actions");

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search"
      description="Search pages, navigate, or take quick actions"
      showCloseButton={false}
    >
      <CommandInput placeholder="Search everything…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {actionGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.url}
                value={`${group.label} ${item.title}`}
                onSelect={() => handleSelect(item.url)}
                className="cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              >
                {item.icon ? (
                  <item.icon className="size-4 shrink-0 text-inherit" />
                ) : null}
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {recentPagesToShow.length > 0 ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Recently Visited">
              {recentPagesToShow.map((page) => (
                <CommandItem
                  key={page.url}
                  value={`Recently Visited ${page.title}`}
                  onSelect={() => handleSelect(page.url)}
                  className="cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                >
                  <IconClock className="size-4 shrink-0 text-inherit" />
                  {page.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        ) : null}
        {(actionGroups.length > 0 || recentPagesToShow.length > 0) &&
        navGroups.length > 0 ? (
          <CommandSeparator />
        ) : null}
        {navGroups.map((group) => (
          <CommandGroup key={group.label} heading={group.label}>
            {group.items.map((item) => (
              <CommandItem
                key={item.url}
                value={`${group.label} ${item.title}`}
                onSelect={() => handleSelect(item.url)}
                className="cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
              >
                {item.icon ? (
                  <item.icon className="size-4 shrink-0 text-inherit" />
                ) : null}
                {item.title}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
