import * as React from "react";
import {
  type Icon,
  IconClock,
  IconReceipt,
  IconUser,
  IconUsers,
} from "@tabler/icons-react";
import { useNavigate } from "react-router";

import { useRecentPages } from "@/hooks/use-recent-pages";
import {
  useGlobalSearchQuery,
  type SearchResultItem,
} from "@/features/search/api/use-global-search";
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

const SEARCH_RESULT_ICONS: Record<SearchResultItem["type"], Icon> = {
  student: IconUsers,
  staff: IconUser,
  guardian: IconUser,
  receipt: IconReceipt,
};

const SEARCH_RESULT_LABELS: Record<SearchResultItem["type"], string> = {
  student: "Student",
  staff: "Staff",
  guardian: "Guardian",
  receipt: "Receipt",
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
  const [searchValue, setSearchValue] = React.useState("");

  const globalSearchQuery = useGlobalSearchQuery(searchValue);
  const searchResults = globalSearchQuery.data?.results ?? [];

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

  React.useEffect(() => {
    if (!open) setSearchValue("");
  }, [open]);

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
      description="Search pages, students, staff, receipts, or navigate"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search everything…"
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Backend search results */}
        {searchResults.length > 0 ? (
          <CommandGroup heading="Search Results">
            {searchResults.map((item) => {
              const ResultIcon = SEARCH_RESULT_ICONS[item.type];
              return (
                <CommandItem
                  key={`${item.type}-${item.id}`}
                  value={`Search ${item.type} ${item.title} ${item.subtitle ?? ""}`}
                  onSelect={() => handleSelect(item.url)}
                  className="cursor-pointer data-[selected=true]:bg-primary data-[selected=true]:text-primary-foreground"
                >
                  <ResultIcon className="size-4 shrink-0 text-inherit" />
                  <div className="flex flex-col min-w-0">
                    <span>{item.title}</span>
                    {item.subtitle ? (
                      <span className="text-xs opacity-60">
                        {SEARCH_RESULT_LABELS[item.type]}
                        {" · "}
                        {item.subtitle}
                      </span>
                    ) : (
                      <span className="text-xs opacity-60">
                        {SEARCH_RESULT_LABELS[item.type]}
                      </span>
                    )}
                  </div>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ) : null}

        {/* Quick actions */}
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

        {/* Recent pages */}
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

        {/* Nav groups */}
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
