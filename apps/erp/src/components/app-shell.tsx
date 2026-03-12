import { BookOpen, Building2, Home, LogIn, School2, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";
import { buttonVariants } from "@academic-platform/ui/components/ui/button";
import { cn } from "@academic-platform/ui/lib/utils";

const PLATFORM_ITEMS = [
  { label: "Home", to: "/", icon: Home },
  { label: "Dashboard", to: "/dashboard", icon: Building2 },
  { label: "Students", to: "/students", icon: Users },
] as const;

const AUTH_ITEMS = [
  { label: "Sign In", to: "/sign-in", icon: LogIn },
  { label: "Create School", to: "/sign-up", icon: School2 },
  { label: "Recovery", to: "/forgot-password", icon: BookOpen },
] as const;

export function AppShell() {
  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-4 py-4 md:px-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-lg font-semibold tracking-tight">
              <School2 className="size-5" />
              <span>Academic Platform</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Default shadcn shell with the existing ERP API flows intact.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
            <NavSection items={PLATFORM_ITEMS} title="Platform" />
            <NavSection items={AUTH_ITEMS} title="Access" />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavSection({
  items,
  title,
}: {
  items: ReadonlyArray<{
    label: string;
    to: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </span>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <NavLink
            key={item.to}
            className={({ isActive }) =>
              cn(
                buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }),
                "justify-start",
              )
            }
            to={item.to}
          >
            <item.icon data-icon="inline-start" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
