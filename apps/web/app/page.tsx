import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@repo/ui/components/ui/badge";
import { Button } from "@repo/ui/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/components/ui/card";
import { WEB_ROUTES } from "@/constants/routes";

const HOME_FEATURES = [
  {
    icon: Building2,
    title: "School-first structure",
    description: "One institution per tenant, multi-campus ready, and built for operator workflows instead of generic CRM patterns.",
  },
  {
    icon: ShieldCheck,
    title: "Backend-owned rules",
    description: "NestJS remains the source of truth for auth, authorization, tenant scope, and ERP business logic.",
  },
  {
    icon: Sparkles,
    title: "Controlled branding",
    description: "Institutions get logo and token-level theming without forking layout, workflows, or supportability.",
  },
] as const;

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8 md:px-10 lg:px-12">
      <header className="flex items-center justify-between gap-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Building2 />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground">
              School ERP
            </p>
            <h1 className="text-lg font-semibold">Institution-ready onboarding</h1>
          </div>
        </div>
        <Button asChild size="sm">
          <Link href={WEB_ROUTES.SIGN_UP}>
            Create school
            <ArrowRight data-icon="inline-end" />
          </Link>
        </Button>
      </header>

      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="flex flex-col gap-6">
          <Badge variant="secondary" className="w-fit">
            Root domain for onboarding only
          </Badge>
          <div className="flex flex-col gap-4">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
              Launch each school into its own ERP workspace without mixing tenant logic into the public site.
            </h2>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
              Use <span className="font-medium text-foreground">erp.test</span> for public entry and school creation.
              After onboarding, admins land in their tenant workspace at a dedicated subdomain.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href={WEB_ROUTES.SIGN_UP}>
                Start onboarding
                <ArrowRight data-icon="inline-end" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="https://demo.erp.test/sign-in">Visit your tenant sign-in</a>
            </Button>
          </div>
        </div>

        <Card className="border-white/70 bg-white/75 shadow-xl shadow-primary/8 backdrop-blur">
          <CardHeader className="gap-3">
            <CardTitle className="text-2xl">What happens after signup</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border/80 bg-background/85 p-4">
              <p className="text-sm font-medium text-muted-foreground">Provisioned instantly</p>
              <p className="mt-2 text-lg font-semibold">
                Institution, default campus, first admin account, membership, and session.
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/85 p-4">
              <p className="text-sm font-medium text-muted-foreground">Next hop</p>
              <p className="mt-2 text-lg font-semibold">
                Redirect to <code className="rounded bg-muted px-2 py-1 text-sm">https://&lt;tenant&gt;.erp.test/dashboard</code>
              </p>
            </div>
            <div className="rounded-2xl border border-border/80 bg-background/85 p-4">
              <p className="text-sm font-medium text-muted-foreground">Operator model</p>
              <p className="mt-2 text-lg font-semibold">
                Tenant selection comes from the hostname. Campus selection happens inside the tenant.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 py-6 md:grid-cols-3">
        {HOME_FEATURES.map(({ description, icon: Icon, title }) => (
          <Card key={title} className="border-white/70 bg-white/70 backdrop-blur">
            <CardHeader className="gap-4">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-accent/55 text-accent-foreground">
                <Icon />
              </div>
              <CardTitle className="text-xl">{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-7 text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </main>
  );
}
