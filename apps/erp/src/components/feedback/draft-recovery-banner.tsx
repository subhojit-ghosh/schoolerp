import { Button } from "@repo/ui/components/ui/button";

type DraftRecoveryBannerProps = {
  hasDraft: boolean;
  onRestore: () => void;
  onDiscard: () => void;
};

/**
 * Shows a recovery banner when a saved draft exists from a previous session.
 * Only renders when `hasDraft` is true.
 */
export function DraftRecoveryBanner({
  hasDraft,
  onRestore,
  onDiscard,
}: DraftRecoveryBannerProps) {
  if (!hasDraft) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm dark:border-amber-900 dark:bg-amber-950">
      <p className="text-amber-800 dark:text-amber-200">
        You have unsaved changes from a previous session.
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Button onClick={onRestore} size="sm" variant="outline">
          Restore
        </Button>
        <Button onClick={onDiscard} size="sm" variant="ghost">
          Discard
        </Button>
      </div>
    </div>
  );
}
