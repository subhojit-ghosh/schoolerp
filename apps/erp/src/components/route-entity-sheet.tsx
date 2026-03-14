import type { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { EntitySheet } from "@/components/entity-sheet";
import { appendSearch } from "@/lib/routes";

type RouteEntitySheetProps = {
  children: ReactNode;
  closeTo: string;
  description?: string;
  title: string;
};

export function RouteEntitySheet({
  children,
  closeTo,
  description,
  title,
}: RouteEntitySheetProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <EntitySheet
      open
      onOpenChange={(open) => {
        if (!open) {
          void navigate(appendSearch(closeTo, location.search));
        }
      }}
      title={title}
      description={description}
    >
      {children}
    </EntitySheet>
  );
}
