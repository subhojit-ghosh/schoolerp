import {
  IconTrendingUp,
  IconUsers,
  IconUsersGroup,
  IconCalendarStats,
  IconCurrencyRupee,
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

const METRICS = [
  {
    label: "Students",
    value: "1,248",
    delta: "+8.2%",
    footer: "Active enrolled this term",
    Icon: IconUsers,
  },
  {
    label: "Staff",
    value: "84",
    delta: "+3.1%",
    footer: "Teaching & administrative",
    Icon: IconUsersGroup,
  },
  {
    label: "Attendance",
    value: "94.6%",
    delta: "+1.4%",
    footer: "Average daily this month",
    Icon: IconCalendarStats,
  },
  {
    label: "Fee collection",
    value: "82%",
    delta: "+5.6%",
    footer: "Collected this billing cycle",
    Icon: IconCurrencyRupee,
  },
] as const;

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      {METRICS.map(({ label, value, delta, footer, Icon }) => (
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
                <IconTrendingUp className="size-3" />
                {delta}
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
