import { Link } from "react-router-dom";
import { Button } from "@repo/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@repo/ui/components/ui/card";
import { SectionCards } from "@/components/section-cards";
import { useSignOutMutation } from "@/features/auth/api/use-auth";
import { useAuthStore } from "@/features/auth/model/auth-store";

export function DashboardPage() {
  const authSession = useAuthStore((store) => store.session);
  const signOutMutation = useSignOutMutation();

  return (
    <div className="grid gap-6">
      <SectionCards />
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid gap-2">
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
        <CardContent>
          The ERP app now uses the stock shadcn dashboard shell and shared
          upstream primitives, while tenant rules and workflows remain owned by
          the API.
        </CardContent>
      </Card>
    </div>
  );
}
