import { IconTrendingUp } from "@tabler/icons-react";
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
    description: "Students",
    value: "1,248",
    delta: "+8.2%",
    footer: "Active student records",
  },
  {
    description: "Staff",
    value: "84",
    delta: "+3.1%",
    footer: "Teaching and admin members",
  },
  {
    description: "Attendance",
    value: "94.6%",
    delta: "+1.4%",
    footer: "Average daily attendance",
  },
  {
    description: "Fee collection",
    value: "82%",
    delta: "+5.6%",
    footer: "Collected against current cycle",
  },
] as const;

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      {METRICS.map((metric) => (
        <Card key={metric.description} className="@container/card">
          <CardHeader>
            <CardDescription>{metric.description}</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {metric.value}
            </CardTitle>
            <CardAction>
              <Badge variant="outline">
                <IconTrendingUp />
                {metric.delta}
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Current ERP baseline <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">{metric.footer}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
