import { useSyncExternalStore, useCallback } from "react";

const STORAGE_KEY = "erp-sidebar-favorites";
const MAX_FAVORITES = 6;

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

function getSnapshot(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string");
  } catch {
    return [];
  }
}

function writeFavorites(urls: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
  emitChange();
}

// Cache the snapshot reference to avoid re-renders when the value has not changed.
let cachedSnapshot: string[] = getSnapshot();
let cachedRaw: string | null = localStorage.getItem(STORAGE_KEY);

function getStableSnapshot(): string[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedSnapshot = getSnapshot();
  }
  return cachedSnapshot;
}

export function useSidebarFavorites(): {
  favorites: string[];
  isFavorite: (url: string) => boolean;
  toggleFavorite: (url: string) => void;
} {
  const favorites = useSyncExternalStore(subscribe, getStableSnapshot);

  const isFavorite = useCallback(
    (url: string): boolean => favorites.includes(url),
    [favorites],
  );

  const toggleFavorite = useCallback((url: string): void => {
    const current = getSnapshot();
    const index = current.indexOf(url);
    if (index >= 0) {
      writeFavorites(current.filter((u) => u !== url));
    } else if (current.length < MAX_FAVORITES) {
      writeFavorites([...current, url]);
    }
  }, []);

  return { favorites, isFavorite, toggleFavorite };
}
