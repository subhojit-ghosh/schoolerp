import { useCallback, useRef, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router";
import { EntitySheet } from "@/components/entities/entity-sheet";
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
  const [open, setOpen] = useState(true);
  const pendingCloseRef = useRef(false);

  const handleExitComplete = useCallback(() => {
    if (!pendingCloseRef.current) {
      return;
    }
    pendingCloseRef.current = false;
    void navigate(appendSearch(closeTo, location.search));
  }, [closeTo, location.search, navigate]);

  return (
    <EntitySheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          setOpen(true);
          return;
        }

        setOpen(false);
        pendingCloseRef.current = true;
      }}
      onExitComplete={handleExitComplete}
      title={title}
      description={description}
    >
      {children}
    </EntitySheet>
  );
}
