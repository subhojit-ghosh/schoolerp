import { useMemo, useState } from "react";
import {
  IconArrowRight,
  IconCircleCheckFilled,
  IconClockHour4,
} from "@tabler/icons-react";
import { Link } from "react-router";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/ui/tabs";
import { EntityToolbarSecondaryAction } from "@/components/entities/entity-actions";
import { EntityListPage } from "@/components/entities/entity-list-page";
import {
  NOTIFICATION_FILTERS,
  NOTIFICATION_FILTER_META,
  NOTIFICATION_SECTIONS,
  NOTIFICATIONS_PAGE_COPY,
  type NotificationItem,
} from "@/features/notifications/model/notification-feed";
import { cn } from "@repo/ui/lib/utils";

type NotificationFilter =
  (typeof NOTIFICATION_FILTERS)[keyof typeof NOTIFICATION_FILTERS];

function getFilteredItems(
  filter: NotificationFilter,
  items: readonly NotificationItem[],
) {
  if (filter === NOTIFICATION_FILTERS.UNREAD) {
    return items.filter((item) => item.unread);
  }

  if (filter === NOTIFICATION_FILTERS.ACTION_REQUIRED) {
    return items.filter((item) => item.actionRequired);
  }

  return items;
}

export function NotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<NotificationFilter>(
    NOTIFICATION_FILTERS.ALL,
  );

  const sections = useMemo(
    () =>
      NOTIFICATION_SECTIONS.map((section) => ({
        ...section,
        items: getFilteredItems(activeFilter, section.items),
      })).filter((section) => section.items.length > 0),
    [activeFilter],
  );

  return (
    <EntityListPage
      title={NOTIFICATIONS_PAGE_COPY.TITLE}
      description={NOTIFICATIONS_PAGE_COPY.DESCRIPTION}
      actions={
        <EntityToolbarSecondaryAction>
          <IconCircleCheckFilled className="size-4" />
          Mark all read
        </EntityToolbarSecondaryAction>
      }
    >
      <Tabs
        className="gap-0"
        onValueChange={(value) => setActiveFilter(value as NotificationFilter)}
        value={activeFilter}
      >
        <div className="border-b border-border/70 px-4 py-4 sm:px-6">
          <TabsList className="h-auto flex-wrap rounded-2xl bg-muted/70 p-1">
            {Object.entries(NOTIFICATION_FILTER_META).map(([key, meta]) => (
              <TabsTrigger
                key={key}
                className="min-w-28 rounded-xl px-4 py-2 text-sm"
                value={key}
              >
                {meta.label}
                <Badge className="ml-1" variant="outline">
                  {meta.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <TabsContent className="m-0" value={activeFilter}>
          {sections.length === 0 ? (
            <div className="flex min-h-72 items-center justify-center px-6 py-16">
              <div className="max-w-sm text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <IconClockHour4 className="size-5 text-muted-foreground" />
                </div>
                <h2 className="mt-4 text-lg font-semibold tracking-tight">
                  Nothing in this filter right now
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Sample data is available in other views. Switch the tab to
                  inspect unread or action-oriented notifications.
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {sections.map((section) => (
                <section key={section.id} className="px-4 py-5 sm:px-6">
                  <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold tracking-tight">
                        {section.label}
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {section.summary}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {section.items.length} items
                    </Badge>
                  </div>

                  <div className="grid gap-3">
                    {section.items.map((item) => (
                      <article
                        key={item.id}
                        className={cn(
                          "rounded-2xl border p-4 transition-colors",
                          item.unread
                            ? "border-primary/30 bg-primary/[0.04]"
                            : "border-border/70 bg-background/70",
                        )}
                      >
                        <div className="flex min-w-0 gap-3">
                          <div
                            className={cn(
                              "mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-2xl border",
                              item.unread
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-border/70 bg-muted/60 text-muted-foreground",
                            )}
                          >
                            <item.Icon className="size-5" />
                          </div>

                          <div className="min-w-0 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-semibold tracking-tight">
                                {item.title}
                              </h3>
                              {item.unread ? <Badge>New</Badge> : null}
                              {item.actionRequired ? (
                                <Badge variant="destructive">
                                  Action required
                                </Badge>
                              ) : null}
                            </div>

                            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                              {item.message}
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span>{item.sender}</span>
                              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                              <span>{item.timestamp}</span>
                              <span className="hidden h-1 w-1 rounded-full bg-border sm:block" />
                              <span>{item.campus}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {item.actions.map((action) => (
                                <Button
                                  key={action.label}
                                  asChild
                                  className="h-9 rounded-lg px-3 text-sm"
                                  size="sm"
                                  variant={
                                    item.actionRequired ? "default" : "outline"
                                  }
                                >
                                  <Link to={action.href}>
                                    {action.label}
                                    <IconArrowRight className="size-3.5" />
                                  </Link>
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </EntityListPage>
  );
}
