import { useState } from "react";
import { IconCalendar } from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Input } from "@repo/ui/components/ui/input";
import {
  EntityPageShell,
  EntityPageHeader,
} from "@/components/entities/entity-page-shell";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useAuthStore } from "@/features/auth/model/auth-store";
import { isStaffContext } from "@/features/auth/model/auth-context";
import { useTeamLeaveCalendarQuery } from "@/features/leave/api/use-leave";
import { formatFullDate } from "@/lib/format";

function getMonthRange(date: Date): { from: string; to: string } {
  const year = date.getFullYear();
  const month = date.getMonth();
  const from = new Date(year, month, 1).toISOString().slice(0, 10);
  const to = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { from, to };
}

export function LeaveTeamCalendarPage() {
  useDocumentTitle("Team Leave Calendar");
  const session = useAuthStore((store) => store.session);
  const isEnabled = isStaffContext(session);

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const dateObj = new Date(selectedDate + "-01");
  const { from, to } = getMonthRange(dateObj);

  const calendarQuery = useTeamLeaveCalendarQuery(isEnabled, from, to);
  const entries = calendarQuery.data ?? [];

  // Group by date for a calendar-like view
  const dateMap = new Map<string, typeof entries>();
  for (const entry of entries) {
    const start = new Date(entry.fromDate);
    const end = new Date(entry.toDate);
    const cursor = new Date(start);
    while (cursor <= end) {
      const dateStr = cursor.toISOString().slice(0, 10);
      if (dateStr >= from && dateStr <= to) {
        const existing = dateMap.get(dateStr) ?? [];
        if (!existing.some((e) => e.id === entry.id)) {
          existing.push(entry);
        }
        dateMap.set(dateStr, existing);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  const sortedDates = Array.from(dateMap.keys()).sort();

  return (
    <EntityPageShell>
      <EntityPageHeader
        title="Team Leave Calendar"
        description="View who is on approved leave across the team"
      />
      <div className="flex items-center gap-3">
        <Input
          type="month"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-48"
        />
      </div>

      {sortedDates.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-16">
          <IconCalendar className="size-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            No approved leaves found for this month.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedDates.map((dateStr) => {
            const dayEntries = dateMap.get(dateStr) ?? [];
            return (
              <div key={dateStr} className="rounded-lg border bg-card">
                <div className="flex items-center gap-2 border-b px-4 py-2 bg-muted/30">
                  <p className="text-sm font-semibold">
                    {formatFullDate(new Date(dateStr))}
                  </p>
                  <Badge variant="secondary" className="text-xs">
                    {dayEntries.length} on leave
                  </Badge>
                </div>
                <div className="divide-y">
                  {dayEntries.map((entry) => (
                    <div
                      key={`${dateStr}-${entry.id}`}
                      className="flex items-center justify-between px-4 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium">{entry.staffName}</p>
                        <p className="text-xs text-muted-foreground">
                          {entry.leaveTypeName}
                          {entry.isHalfDay ? " (half-day)" : ""}
                          {" · "}
                          {entry.fromDate === entry.toDate
                            ? entry.fromDate
                            : `${entry.fromDate} to ${entry.toDate}`}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {entry.daysCount}{" "}
                        {entry.daysCount === 1 ? "day" : "days"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </EntityPageShell>
  );
}
