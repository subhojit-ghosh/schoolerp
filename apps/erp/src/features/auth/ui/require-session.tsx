import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { useSessionQuery } from "../api/use-auth";
import { useAuthStore } from "../model/auth-store";

export function RequireSession({ children }: PropsWithChildren) {
  const { isLoading } = useSessionQuery();
  const status = useAuthStore((store) => store.status);

  if (isLoading || status === "unknown") {
    return (
      <Card className="max-w-2xl">
        <p className="text-sm text-muted-foreground">Checking your session...</p>
      </Card>
    );
  }

  if (status !== "authenticated") {
    return <Navigate replace to="/sign-in" />;
  }

  return children;
}
