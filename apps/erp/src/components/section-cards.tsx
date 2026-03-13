import {
  IconBuildingEstate,
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
import type { AuthSession } from "@/features/auth/model/auth.types";

const LOADING_VALUE = "—";
const CAMPUS_FALLBACK = "Not set";
const MULTI_CAMPUS_STATUS = "Multi-campus";
const SINGLE_CAMPUS_STATUS = "Single campus";

type CardDef = {
  label: string;
  value: string;
  badge: string;
  Icon: Icon;
};

type SectionCardsProps = {
  isLoadingStudents: boolean;
  session: AuthSession | null;
  studentCount: number;
};

export function SectionCards({
  isLoadingStudents,
  session,
  studentCount,
}: SectionCardsProps) {
  const campusCount = session?.campuses.length ?? 0;
  const membershipCount = session?.memberships.length ?? 0;

  const cards: CardDef[] = [
    {
      label: "Enrolled students",
      value: isLoadingStudents ? LOADING_VALUE : String(studentCount),
      badge: isLoadingStudents ? "Syncing…" : studentCount === 1 ? "1 student" : `${studentCount} students`,
      Icon: IconUsers,
    },
    {
      label: "Active campus",
      value: session?.activeCampus?.name ?? CAMPUS_FALLBACK,
      badge: campusCount > 1 ? MULTI_CAMPUS_STATUS : SINGLE_CAMPUS_STATUS,
      Icon: IconBuildingEstate,
    },
    {
      label: "Your roles",
      value: String(membershipCount || LOADING_VALUE),
      badge: membershipCount === 1 ? "1 active role" : `${membershipCount} roles`,
      Icon: IconUsersGroup,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-3">
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
            style={{ background: "color-mix(in srgb, var(--primary) 7%, transparent)" }}
          />
          <CardHeader>
            <CardDescription className="flex items-center gap-2">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded"
                style={{
                  background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                }}
              >
                <Icon className="size-3.5" style={{ color: "var(--primary)" }} />
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
