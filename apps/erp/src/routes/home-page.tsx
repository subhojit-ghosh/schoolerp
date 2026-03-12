import { ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function HomePage() {
  return (
    <Card className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <div className="space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          <ShieldCheck className="size-3.5" />
          Fresh Vite ERP
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-semibold tracking-tight">The new ERP foundation is live.</h2>
          <p className="max-w-xl text-sm leading-7 text-muted-foreground">
            This app is now positioned as the long-term school ERP frontend. The old Next.js ERP app has been moved out
            of the active workspace so new feature work lands here instead.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link to="/sign-up">
              Start a school signup
              <ArrowRight className="size-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link to="/dashboard">View dashboard shell</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 rounded-3xl border border-border bg-muted/40 p-5">
        <Snapshot
          title="Auth"
          description="Mobile-first credentials with HTTP-only cookies managed by Nest."
        />
        <Snapshot
          title="Tenant"
          description="Institution resolved from subdomain, campus context inside the tenant."
        />
        <Snapshot
          title="Branding"
          description="Logo, favicon, and token-based colors applied at bootstrap."
        />
      </div>
    </Card>
  );
}

function Snapshot({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  );
}
