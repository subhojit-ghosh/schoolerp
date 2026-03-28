import { useEffect } from "react";
import { useBlocker } from "react-router";

/**
 * Warn users before navigating away from a form with unsaved changes.
 *
 * - Shows a native `beforeunload` prompt on tab close / hard refresh.
 * - Shows a React Router blocker dialog on in-app navigation.
 *
 * @param isDirty - `true` when the form has unsaved changes.
 *                  Typically from `formState.isDirty` in react-hook-form.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  // Browser-level: tab close, hard refresh, external navigation
  useEffect(() => {
    if (!isDirty) return;

    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // React Router: in-app navigation while form is dirty
  const blocker = useBlocker(isDirty);

  return blocker;
}
