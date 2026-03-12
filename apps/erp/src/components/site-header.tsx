import { useLocation } from "react-router-dom";
import { Badge } from "@repo/ui/components/ui/badge";
import { Separator } from "@repo/ui/components/ui/separator";
import { SidebarTrigger } from "@repo/ui/components/ui/sidebar";
import { useAuthStore } from "@/features/auth/model/auth-store";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/students": "Students",
} as const;

export function SiteHeader() {
  const location = useLocation();
  const session = useAuthStore((store) => store.session);
  const title =
    PAGE_TITLES[location.pathname as keyof typeof PAGE_TITLES] ?? "ERP";
  const campusName = session?.activeCampus?.name ?? "Campus";

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mx-2 data-[orientation=vertical]:h-4"
        />
        <h1 className="text-base font-medium">{title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline">{campusName}</Badge>
        </div>
      </div>
    </header>
  );
}
