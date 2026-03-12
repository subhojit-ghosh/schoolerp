import { ArrowRight, Building2, Palette, ShieldCheck } from "lucide-react";
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

const SNAPSHOTS = [
  {
    title: "Auth",
    description: "NestJS owns mobile-first sign in, sessions, and recovery.",
    icon: ShieldCheck,
  },
  {
    title: "Tenant",
    description: "Institution comes from subdomain. Campus stays inside tenant scope.",
    icon: Building2,
  },
  {
    title: "Branding",
    description: "School identity stays token-driven instead of layout-driven.",
    icon: Palette,
  },
] as const;

export function HomePage() {
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <Badge variant="outline">Shadcn Baseline</Badge>
          <CardTitle>The ERP frontend is now on the default UI track.</CardTitle>
          <CardDescription>
            The goal from here is straightforward: keep feature work moving on
            top of standard shadcn patterns instead of maintaining a custom
            visual layer.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/sign-up">
              Create a school
              <ArrowRight data-icon="inline-end" />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/dashboard">Open dashboard</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {SNAPSHOTS.map((snapshot) => (
          <Card key={snapshot.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <snapshot.icon />
                <span>{snapshot.title}</span>
              </CardTitle>
              <CardDescription>{snapshot.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
