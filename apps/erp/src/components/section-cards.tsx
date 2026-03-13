import {
  IconBuildingEstate,
  IconCalendarStats,
  IconRosetteDiscountCheck,
  IconUsers,
  IconUsersGroup,
} from "@tabler/icons-react";
import { Badge } from "@repo/ui/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import type { AuthSession } from "@/features/auth/model/auth.types";

const DEFAULT_NUMERIC_VALUE = "0";
const LOADING_VALUE = "Loading…";
const CAMPUS_FALLBACK = "Not selected";
const MULTI_CAMPUS_STATUS = "Multi-campus ready";
const SINGLE_CAMPUS_STATUS = "Single campus";
const ROLE_SINGLE_LABEL = "Active role";
const ROLE_PLURAL_LABEL = "Active roles";
const ROLE_LOADING_DESCRIPTION = "Resolving access context";
const STUDENT_LOADING_DESCRIPTION = "Fetching enrolled students";
const STUDENT_DESCRIPTION = "Student records available in this institution";
const CAMPUS_DESCRIPTION = "Campus context for this session";
const ROLE_DESCRIPTION = "Membership contexts on this login";

function formatRoleCount(count: number) {
  return `${count} ${count === 1 ? ROLE_SINGLE_LABEL : ROLE_PLURAL_LABEL}`;
}

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
  const cards = [
    {
      label: "Students",
      value: isLoadingStudents ? LOADING_VALUE : String(studentCount),
      badge: isLoadingStudents ? "Syncing" : `${studentCount} enrolled`,
      footer: isLoadingStudents ? STUDENT_LOADING_DESCRIPTION : STUDENT_DESCRIPTION,
      Icon: IconUsers,
    },
    {
      label: "Campus",
      value: session?.activeCampus?.name ?? CAMPUS_FALLBACK,
      badge: campusCount > 1 ? MULTI_CAMPUS_STATUS : SINGLE_CAMPUS_STATUS,
      footer: CAMPUS_DESCRIPTION,
      Icon: IconBuildingEstate,
    },
    {
      label: "Access",
      value: membershipCount > 0 ? formatRoleCount(membershipCount) : DEFAULT_NUMERIC_VALUE,
      badge: membershipCount > 1 ? "Multi-context" : "Single context",
      footer: membershipCount > 0 ? ROLE_DESCRIPTION : ROLE_LOADING_DESCRIPTION,
      Icon: IconUsersGroup,
    },
    {
      label: "Session",
      value: session?.activeOrganization?.shortName ?? LOADING_VALUE,
      badge: session?.activeCampus ? session.activeCampus.name : "Awaiting campus",
      footer: "Tenant-scoped workspace resolved from the hostname",
      Icon: IconRosetteDiscountCheck,
    },
  ] as const;

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {cards.map(({ label, value, badge, footer, Icon }) => (
        <Card key={label} className="@container/card">
          <CardHeader>
            <CardDescription className="flex items-center gap-1.5">
              <Icon className="size-3.5 text-muted-foreground/70" />
              {label}
            </CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {value}
            </CardTitle>
            <CardAction>
              <Badge className="gap-1" variant="outline">
                <IconCalendarStats className="size-3" />
                {badge}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter>
            <p className="text-sm text-muted-foreground">{footer}</p>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
