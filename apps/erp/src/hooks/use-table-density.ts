import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "erp-table-density";

type TableDensity = "comfortable" | "compact" | "spacious";

const TABLE_DENSITIES: TableDensity[] = ["compact", "comfortable", "spacious"];

const DEFAULT_DENSITY: TableDensity = "comfortable";

type Listener = () => void;

const listeners = new Set<Listener>();

function emitChange(): void {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function isValidDensity(value: unknown): value is TableDensity {
  return (
    typeof value === "string" && TABLE_DENSITIES.includes(value as TableDensity)
  );
}

function getSnapshot(): TableDensity {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (isValidDensity(raw)) return raw;
  return DEFAULT_DENSITY;
}

function writeDensity(density: TableDensity): void {
  localStorage.setItem(STORAGE_KEY, density);
  emitChange();
}

// Cache the snapshot reference to avoid re-renders when the value has not changed.
let cachedSnapshot: TableDensity = getSnapshot();
let cachedRaw: string | null = localStorage.getItem(STORAGE_KEY);

function getStableSnapshot(): TableDensity {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getSnapshot();
  }
  return cachedSnapshot;
}

export function useTableDensity(): {
  density: TableDensity;
  setDensity: (d: TableDensity) => void;
} {
  const density = useSyncExternalStore(subscribe, getStableSnapshot);

  const setDensity = useCallback((d: TableDensity): void => {
    writeDensity(d);
  }, []);

  return { density, setDensity };
}

export { TABLE_DENSITIES, DEFAULT_DENSITY };
export type { TableDensity };
