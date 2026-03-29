import {
  IconCalendarStats,
  IconCurrencyRupee,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import type { Icon } from "@tabler/icons-react";

const LOADING_VALUE = "—";
const LOADING_BADGE = "Syncing...";

type CardDef = {
  label: string;
  value: string;
  badge: string;
  Icon: Icon;
};

type SectionCardsProps = {
  attendanceBadge: string;
  isLoadingAttendance: boolean;
  isLoadingFees: boolean;
  isLoadingStaff: boolean;
  isLoadingStudents: boolean;
  outstandingFeesValue: string;
  staffCount: number;
  studentCount: number;
  todayAttendanceValue: string;
};

export function SectionCards({
  attendanceBadge,
  isLoadingAttendance,
  isLoadingFees,
  isLoadingStaff,
  isLoadingStudents,
  outstandingFeesValue,
  staffCount,
  studentCount,
  todayAttendanceValue,
}: SectionCardsProps) {
  const cards: CardDef[] = [
    {
      label: "Active students",
      value: isLoadingStudents ? LOADING_VALUE : String(studentCount),
      badge: isLoadingStudents
        ? LOADING_BADGE
        : studentCount === 1
          ? "1 student"
          : `${studentCount} students`,
      Icon: IconUsers,
    },
    {
      label: "Staff members",
      value: isLoadingStaff ? LOADING_VALUE : String(staffCount),
      badge: isLoadingStaff
        ? LOADING_BADGE
        : staffCount === 1
          ? "1 staff"
          : `${staffCount} staff`,
      Icon: IconUsersGroup,
    },
    {
      label: "Today's attendance",
      value: isLoadingAttendance ? LOADING_VALUE : todayAttendanceValue,
      badge: isLoadingAttendance ? LOADING_BADGE : attendanceBadge,
      Icon: IconCalendarStats,
    },
    {
      label: "Outstanding fees",
      value: isLoadingFees ? LOADING_VALUE : outstandingFeesValue,
      badge: isLoadingFees ? LOADING_BADGE : "Across current filters",
      Icon: IconCurrencyRupee,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @4xl/main:grid-cols-4">
      {cards.map(({ label, value, badge, Icon }) => (
        <Card key={label} className="@container/card relative overflow-hidden">
          {/* Primary-color top accent bar */}
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: "var(--primary)" }}
          />
          {/* Decorative circle — responds to primary color */}
          <div
            className="pointer-events-none absolute right-0 top-0 h-28 w-28 translate-x-10 -translate-y-10 rounded-full"
            style={{
              background: "color-mix(in srgb, var(--primary) 7%, transparent)",
            }}
          />
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{
                  background:
                    "color-mix(in srgb, var(--primary) 12%, transparent)",
                }}
              >
                <Icon
                  className="size-3.5"
                  style={{ color: "var(--primary)" }}
                />
              </span>
              {label}
            </CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums">
              {value}
            </CardTitle>
            <CardAction>
              <Badge variant="secondary">{badge}</Badge>
            </CardAction>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}
