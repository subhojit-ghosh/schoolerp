import type { Blocker } from "react-router";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/ui/alert-dialog";

type UnsavedChangesDialogProps = {
  blocker: Blocker;
};

/**
 * Confirmation dialog shown when the user tries to navigate away
 * from a form with unsaved changes.
 *
 * Pair with `useUnsavedChangesGuard()`:
 *
 * ```tsx
 * const blocker = useUnsavedChangesGuard(formState.isDirty);
 * // ...
 * <UnsavedChangesDialog blocker={blocker} />
 * ```
 */
export function UnsavedChangesDialog({ blocker }: UnsavedChangesDialogProps) {
  if (blocker.state !== "blocked") return null;

  return (
    <AlertDialog open>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
          <AlertDialogDescription>
            You have unsaved changes that will be lost if you leave this page.
            Are you sure you want to discard them?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => blocker.reset()}>
            Stay on page
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() => blocker.proceed()}
          >
            Discard changes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
