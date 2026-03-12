import { CalendarDays, CreditCard, GraduationCap, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@academic-platform/ui/components/ui/badge";
import { Button } from "@academic-platform/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@academic-platform/ui/components/ui/card";
import { useSignOutMutation } from "@/features/auth/api/use-auth";
import { useAuthStore } from "@/features/auth/model/auth-store";

const DASHBOARD_METRICS = [
  { icon: Users, label: "Students", value: "1,248" },
  { icon: GraduationCap, label: "Staff", value: "84" },
  { icon: CalendarDays, label: "Attendance", value: "94.6%" },
  { icon: CreditCard, label: "Fee Collection", value: "82%" },
] as const;

export function DashboardPage() {
  const authSession = useAuthStore((store) => store.session);
  const signOutMutation = useSignOutMutation();

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline">Institution Shell</Badge>
              <CardTitle>One shared structure for every school.</CardTitle>
              <CardDescription>
                Signed in as {authSession?.user.name} ({authSession?.user.mobile}
                ).
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline">
                <Link to="/students">Open students</Link>
              </Button>
              <Button
                onClick={() => signOutMutation.mutate({})}
                variant="outline"
              >
                Sign out
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD_METRICS.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <metric.icon />
                <span>{metric.label}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{metric.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
