import { useCallback, useEffect, useRef, useState } from "react";
import type { FieldValues, UseFormReset, UseFormWatch } from "react-hook-form";

const STORAGE_PREFIX = "erp-draft:";
const DEFAULT_INTERVAL_MS = 10_000;

type UseFormAutoSaveOptions<T extends FieldValues> = {
  /** Unique key per form instance (e.g. "student-create", "fee-structure-edit-{id}") */
  key: string;
  /** The `watch` function from react-hook-form */
  watch: UseFormWatch<T>;
  /** The `reset` function from react-hook-form */
  reset: UseFormReset<T>;
  /** Whether the form has been modified */
  isDirty: boolean;
  /** Auto-save interval in milliseconds (default 10 seconds) */
  intervalMs?: number;
};

type UseFormAutoSaveReturn = {
  /** Whether a saved draft exists for this form key */
  hasDraft: boolean;
  /** Restore saved draft values into the form */
  restoreDraft: () => void;
  /** Discard the saved draft without restoring */
  discardDraft: () => void;
  /** Clear the draft (call on successful submit) */
  clearDraft: () => void;
};

function storageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeDraft<T>(key: string, values: T): void {
  try {
    localStorage.setItem(storageKey(key), JSON.stringify(values));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

function removeDraft(key: string): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {
    // silently skip
  }
}

/**
 * Auto-saves form values to localStorage every N seconds.
 * On mount, checks if there is a saved draft and offers to restore it.
 */
export function useFormAutoSave<T extends FieldValues>({
  key,
  watch,
  reset,
  isDirty,
  intervalMs = DEFAULT_INTERVAL_MS,
}: UseFormAutoSaveOptions<T>): UseFormAutoSaveReturn {
  const [hasDraft, setHasDraft] = useState(() => readDraft(key) !== null);
  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  const watchRef = useRef(watch);
  watchRef.current = watch;

  // Auto-save on interval when dirty
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isDirtyRef.current) return;

      const values = watchRef.current();
      writeDraft(key, values);
      setHasDraft(true);
    }, intervalMs);

    return () => clearInterval(interval);
  }, [key, intervalMs]);

  const restoreDraft = useCallback(() => {
    const saved = readDraft<T>(key);
    if (!saved) return;

    reset(saved, { keepDefaultValues: true });
    setHasDraft(false);
  }, [key, reset]);

  const discardDraft = useCallback(() => {
    removeDraft(key);
    setHasDraft(false);
  }, [key]);

  const clearDraft = useCallback(() => {
    removeDraft(key);
    setHasDraft(false);
  }, [key]);

  return { hasDraft, restoreDraft, discardDraft, clearDraft };
}
