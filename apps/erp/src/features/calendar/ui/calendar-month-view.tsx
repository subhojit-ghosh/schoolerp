import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@repo/ui/components/ui/button";
import { cn } from "@repo/ui/lib/utils";
import { buildCalendarEventEditRoute } from "@/constants/routes";
import { CALENDAR_EVENT_TYPE_OPTIONS } from "@/features/calendar/model/calendar-list.constants";
import { appendSearch } from "@/lib/routes";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const MAX_VISIBLE_EVENTS = 3;

const EVENT_TYPE_COLORS: Record<string, string> = {
  event: "bg-blue-500",
  holiday: "bg-red-500",
  exam: "bg-amber-500",
  deadline: "bg-purple-500",
};

const EVENT_TYPE_TEXT_COLORS: Record<string, string> = {
  event: "text-blue-700 dark:text-blue-300",
  holiday: "text-red-700 dark:text-red-300",
  exam: "text-amber-700 dark:text-amber-300",
  deadline: "text-purple-700 dark:text-purple-300",
};

const EVENT_TYPE_BG_COLORS: Record<string, string> = {
  event: "bg-blue-50 dark:bg-blue-950/40",
  holiday: "bg-red-50 dark:bg-red-950/40",
  exam: "bg-amber-50 dark:bg-amber-950/40",
  deadline: "bg-purple-50 dark:bg-purple-950/40",
};

type CalendarEvent = {
  id: string;
  title: string;
  eventType: "event" | "holiday" | "exam" | "deadline";
  eventDate: string;
  isAllDay: boolean;
  startTime?: string | null;
  endTime?: string | null;
  status: "active" | "inactive" | "deleted";
};

type CalendarMonthViewProps = {
  events: CalendarEvent[];
  isLoading: boolean;
};

type DayCell = {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  dateKey: string;
};

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildMonthGrid(year: number, month: number): DayCell[] {
  const today = new Date();
  const todayKey = toDateKey(today);

  const firstOfMonth = new Date(year, month, 1);
  // Monday = 0, Sunday = 6 (ISO weekday)
  const startDayOfWeek = (firstOfMonth.getDay() + 6) % 7;

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: DayCell[] = [];

  // Leading days from previous month
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const date = new Date(year, month - 1, day);
    const dayOfWeek = (date.getDay() + 6) % 7;
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: dayOfWeek >= 5,
      dateKey: toDateKey(date),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateKey = toDateKey(date);
    const dayOfWeek = (date.getDay() + 6) % 7;
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: true,
      isToday: dateKey === todayKey,
      isWeekend: dayOfWeek >= 5,
      dateKey,
    });
  }

  // Trailing days from next month
  const totalCells = cells.length <= 35 ? 35 : 42;
  const remaining = totalCells - cells.length;
  for (let day = 1; day <= remaining; day++) {
    const date = new Date(year, month + 1, day);
    const dayOfWeek = (date.getDay() + 6) % 7;
    cells.push({
      date,
      dayOfMonth: day,
      isCurrentMonth: false,
      isToday: false,
      isWeekend: dayOfWeek >= 5,
      dateKey: toDateKey(date),
    });
  }

  return cells;
}

function getEventTypeLabel(eventType: string): string {
  const option = CALENDAR_EVENT_TYPE_OPTIONS.find(
    (o) => o.value === eventType,
  );
  return option?.label ?? eventType;
}

export function CalendarMonthView({
  events,
  isLoading,
}: CalendarMonthViewProps) {
  const location = useLocation();
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const cells = useMemo(
    () => buildMonthGrid(viewDate.year, viewDate.month),
    [viewDate.year, viewDate.month],
  );

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      if (event.status === "deleted") {
        continue;
      }
      const existing = map.get(event.eventDate);
      if (existing) {
        existing.push(event);
      } else {
        map.set(event.eventDate, [event]);
      }
    }
    return map;
  }, [events]);

  const selectedDateEvents = useMemo(() => {
    if (!selectedDate) {
      return [];
    }
    return eventsByDate.get(selectedDate) ?? [];
  }, [selectedDate, eventsByDate]);

  function handlePrevMonth(): void {
    setViewDate((prev) => {
      if (prev.month === 0) {
        return { year: prev.year - 1, month: 11 };
      }
      return { year: prev.year, month: prev.month - 1 };
    });
    setSelectedDate(null);
  }

  function handleNextMonth(): void {
    setViewDate((prev) => {
      if (prev.month === 11) {
        return { year: prev.year + 1, month: 0 };
      }
      return { year: prev.year, month: prev.month + 1 };
    });
    setSelectedDate(null);
  }

  function handleToday(): void {
    const now = new Date();
    setViewDate({ year: now.getFullYear(), month: now.getMonth() });
    setSelectedDate(toDateKey(now));
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
        Loading calendar...
      </div>
    );
  }

  const displayDate = new Date(viewDate.year, viewDate.month, 1);

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold tracking-tight">
            {formatMonthYear(displayDate)}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <Button
            className="h-8 px-3 text-xs"
            onClick={handleToday}
            size="sm"
            variant="outline"
          >
            Today
          </Button>
          <Button
            className="size-8"
            onClick={handlePrevMonth}
            size="icon"
            variant="ghost"
          >
            <IconChevronLeft className="size-4" />
            <span className="sr-only">Previous month</span>
          </Button>
          <Button
            className="size-8"
            onClick={handleNextMonth}
            size="icon"
            variant="ghost"
          >
            <IconChevronRight className="size-4" />
            <span className="sr-only">Next month</span>
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-hidden rounded-lg border border-border/70">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              className={cn(
                "px-2 py-2 text-center text-xs font-medium text-muted-foreground",
                index >= 5 && "text-muted-foreground/60",
              )}
              key={label}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayEvents = eventsByDate.get(cell.dateKey) ?? [];
            const visibleEvents = dayEvents.slice(0, MAX_VISIBLE_EVENTS);
            const overflowCount = dayEvents.length - MAX_VISIBLE_EVENTS;
            const isSelected = selectedDate === cell.dateKey;

            return (
              <button
                className={cn(
                  "group relative min-h-[88px] border-b border-r border-border/40 p-1.5 text-left transition-colors hover:bg-accent/30",
                  cell.isWeekend && "bg-muted/20",
                  !cell.isCurrentMonth && "bg-muted/10",
                  isSelected && "bg-accent/40 ring-1 ring-inset ring-primary/30",
                )}
                key={cell.dateKey}
                onClick={() => setSelectedDate(cell.dateKey)}
                type="button"
              >
                {/* Day number */}
                <span
                  className={cn(
                    "inline-flex size-6 items-center justify-center rounded-full text-xs font-medium",
                    cell.isToday &&
                      "bg-primary text-primary-foreground font-semibold",
                    !cell.isCurrentMonth && "text-muted-foreground/40",
                    cell.isCurrentMonth &&
                      !cell.isToday &&
                      "text-foreground",
                  )}
                >
                  {cell.dayOfMonth}
                </span>

                {/* Event pills */}
                <div className="mt-0.5 space-y-0.5">
                  {visibleEvents.map((event) => (
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded px-1 py-0.5 text-[10px] leading-tight",
                        EVENT_TYPE_BG_COLORS[event.eventType] ??
                          "bg-muted",
                        EVENT_TYPE_TEXT_COLORS[event.eventType] ??
                          "text-foreground",
                        event.status === "inactive" && "opacity-50",
                      )}
                      key={event.id}
                    >
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          EVENT_TYPE_COLORS[event.eventType] ??
                            "bg-muted-foreground",
                        )}
                      />
                      <span className="truncate font-medium">
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {overflowCount > 0 && (
                    <div className="px-1 text-[10px] font-medium text-muted-foreground">
                      +{overflowCount} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day detail panel */}
      {selectedDate ? (
        <div className="rounded-lg border border-border/70 bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">
            {new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>
          {selectedDateEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events on this day.
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDateEvents.map((event) => (
                <Link
                  className={cn(
                    "flex items-center gap-3 rounded-md border border-border/50 px-3 py-2 transition-colors hover:bg-accent/30",
                    event.status === "inactive" && "opacity-60",
                  )}
                  key={event.id}
                  to={appendSearch(
                    buildCalendarEventEditRoute(event.id),
                    location.search,
                  )}
                >
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      EVENT_TYPE_COLORS[event.eventType] ??
                        "bg-muted-foreground",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{event.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {getEventTypeLabel(event.eventType)}
                      {event.isAllDay
                        ? " -- All day"
                        : ` -- ${event.startTime ?? ""} - ${event.endTime ?? ""}`}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
