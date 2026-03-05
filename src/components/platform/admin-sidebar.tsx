"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformSignOutButton } from "@/components/platform/platform-sign-out-button";

const NAV_ITEMS = [
  { label: "Institutions", href: "/admin/institutions", icon: Building2 },
];

type AdminSidebarProps = {
  adminName: string;
};

export function AdminSidebar({ adminName }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="flex h-svh w-60 flex-col border-r bg-sidebar">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-semibold tracking-tight">Platform Admin</span>
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              pathname.startsWith(href)
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="border-t p-3">
        <p className="text-muted-foreground mb-2 truncate px-1 text-xs">{adminName}</p>
        <PlatformSignOutButton />
      </div>
    </aside>
  );
}
