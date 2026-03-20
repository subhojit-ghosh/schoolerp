import { useEffect, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { EntitySheet } from "@/components/entities/entity-sheet";
import { appendSearch } from "@/lib/routes";

const SHEET_CLOSE_NAVIGATION_DELAY_MS = 300;

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
  const [open, setOpen] = useState(true);
  const closeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current !== null) {
        window.clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  return (
    <EntitySheet
      open={open}
      onOpenChange={(open) => {
        if (open) {
          setOpen(true);
          return;
        }

        setOpen(false);

        if (closeTimeoutRef.current !== null) {
          return;
        }

        closeTimeoutRef.current = window.setTimeout(() => {
          closeTimeoutRef.current = null;
          void navigate(appendSearch(closeTo, location.search));
        }, SHEET_CLOSE_NAVIGATION_DELAY_MS);
      }}
      title={title}
      description={description}
    >
      {children}
    </EntitySheet>
  );
}
