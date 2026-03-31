import { useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { ERP_ROUTES } from "@/constants/routes";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;

  const tagName = target.tagName;
  return tagName === "INPUT" || tagName === "TEXTAREA" || tagName === "SELECT";
}

type ShortcutDef = {
  key: string;
  alt?: boolean;
  ctrl?: boolean;
  meta?: boolean;
  action: () => void;
};

const CONTEXT_NEW_ENTITY_MAP: Record<string, string> = {
  [ERP_ROUTES.STUDENTS]: ERP_ROUTES.STUDENT_CREATE,
  [ERP_ROUTES.STAFF]: ERP_ROUTES.STAFF_CREATE,
  [ERP_ROUTES.ACADEMIC_YEARS]: ERP_ROUTES.ACADEMIC_YEAR_CREATE,
  [ERP_ROUTES.CLASSES]: ERP_ROUTES.CLASS_CREATE,
  [ERP_ROUTES.SUBJECTS]: ERP_ROUTES.SUBJECT_CREATE,
  [ERP_ROUTES.HOMEWORK]: ERP_ROUTES.HOMEWORK_CREATE,
};

export function useKeyboardShortcuts(
  onOpenSearch?: () => void,
): void {
  const navigate = useNavigate();
  const location = useLocation();

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) return;

      const shortcuts: ShortcutDef[] = [
        { key: "d", alt: true, action: () => navigate(ERP_ROUTES.DASHBOARD) },
        {
          key: "a",
          alt: true,
          action: () => navigate(ERP_ROUTES.ATTENDANCE),
        },
        {
          key: "f",
          alt: true,
          action: () => navigate(ERP_ROUTES.FEE_STRUCTURES),
        },
        { key: "s", alt: true, action: () => navigate(ERP_ROUTES.STUDENTS) },
        { key: "m", alt: true, action: () => navigate(ERP_ROUTES.EXAMS) },
        { key: "h", alt: true, action: () => navigate(ERP_ROUTES.HOMEWORK) },
        {
          key: "n",
          alt: true,
          action: () => {
            const newRoute = CONTEXT_NEW_ENTITY_MAP[location.pathname];
            if (newRoute) {
              navigate(newRoute);
            }
          },
        },
      ];

      if (onOpenSearch) {
        shortcuts.push({
          key: "k",
          ctrl: true,
          action: () => {
            event.preventDefault();
            onOpenSearch();
          },
        });
      }

      for (const shortcut of shortcuts) {
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !(event.ctrlKey || event.metaKey);

        if (
          event.key.toLowerCase() === shortcut.key &&
          altMatch &&
          ctrlMatch
        ) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [navigate, location.pathname, onOpenSearch],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
