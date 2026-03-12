import { School2, Sparkles } from "lucide-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const NAV_LINKS = [
  { label: "Sign In", to: "/sign-in" },
  { label: "Create School", to: "/sign-up" },
  { label: "Workspace", to: "/dashboard" },
] as const;

export function AppShell() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.92),_rgba(246,239,230,0.98)_50%,_rgba(231,222,209,1)_100%)] text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 rounded-3xl border border-white/60 bg-white/70 px-5 py-4 shadow-sm backdrop-blur">
          <Link className="flex items-center gap-3" to="/">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-[var(--primary)] text-primary-foreground">
              <School2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-wide text-muted-foreground">
                School ERP
              </p>
              <p className="text-lg font-semibold">Institution-ready shell</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {NAV_LINKS.map((item) => (
              <NavLink
                className={({ isActive }) =>
                  [
                    "rounded-full px-4 py-2 text-sm transition-colors",
                    isActive ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                  ].join(" ")
                }
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <Button asChild className="hidden md:inline-flex">
            <Link to="/sign-up">Create School</Link>
          </Button>
        </header>

        <main className="grid flex-1 gap-6 py-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="space-y-6">
            <Card className="overflow-hidden border-none bg-[linear-gradient(135deg,rgba(255,255,255,0.98),rgba(255,248,239,0.96))]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground shadow-sm">
                    <Sparkles className="size-3.5" />
                    ERP Rebuild Foundation
                  </div>
                  <div className="space-y-2">
                    <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                      Mobile-first school operations, clean tenant theming, and a Nest-owned backend.
                    </h1>
                    <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                      This shell is intentionally opinionated: one shared product structure for every school, with
                      branding driven by tokens instead of custom layouts.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric title="Primary Auth" value="Mobile + Password" />
                  <Metric title="Tenant Model" value="Subdomain per School" />
                </div>
              </div>
            </Card>

            <Outlet />
          </section>

          <aside className="space-y-6">
            <Card className="bg-[linear-gradient(180deg,rgba(15,23,42,0.96),rgba(30,41,59,0.96))] text-slate-50">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
                Tenant Branding
              </p>
              <div className="mt-4 grid gap-4">
                <BrandToken name="Primary" token="--primary" />
                <BrandToken name="Accent" token="--accent" />
                <BrandToken name="Sidebar" token="--sidebar-primary" />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Institution admins can customize colors, logos, and favicon while the layout and component system stay
                shared.
              </p>
            </Card>

            <Card>
              <h2 className="text-lg font-semibold">Implementation priorities</h2>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
                <li>Self-serve school signup that provisions tenant + first admin.</li>
                <li>Passport auth with HTTP-only cookies from Nest.</li>
                <li>Guardian + staff identity on the same user record.</li>
                <li>Campus switching inside a tenant, not cross-tenant switching.</li>
              </ul>
            </Card>
          </aside>
        </main>
      </div>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{title}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function BrandToken({ name, token }: { name: string; token: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <div>
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-slate-300">{token}</p>
      </div>
      <div
        className="size-8 rounded-full border border-white/20"
        style={{ backgroundColor: `var(${token})` }}
      />
    </div>
  );
}
