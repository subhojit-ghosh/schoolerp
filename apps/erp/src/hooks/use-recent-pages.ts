import { useCallback, useSyncExternalStore } from "react";

type RecentPage = {
  url: string;
  title: string;
  visitedAt: number;
};

const STORAGE_KEY = "erp-recent-pages";
const MAX_ENTRIES = 10;

const listeners = new Set<() => void>();

function notifyListeners(): void {
  for (const listener of listeners) {
    listener();
  }
}

function getSnapshot(): RecentPage[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];

  try {
    return JSON.parse(raw) as RecentPage[];
  } catch {
    return [];
  }
}

let cachedSnapshot = getSnapshot();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getStoreSnapshot(): RecentPage[] {
  return cachedSnapshot;
}

function addRecentPageToStorage(url: string, title: string): void {
  const pages = getSnapshot();
  const filtered = pages.filter((p) => p.url !== url);
  const updated: RecentPage[] = [
    { url, title, visitedAt: Date.now() },
    ...filtered,
  ].slice(0, MAX_ENTRIES);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  cachedSnapshot = updated;
  notifyListeners();
}

export function useRecentPages(): {
  recentPages: RecentPage[];
  addRecentPage: (url: string, title: string) => void;
} {
  const recentPages = useSyncExternalStore(subscribe, getStoreSnapshot);

  const addRecentPage = useCallback(
    (url: string, title: string) => addRecentPageToStorage(url, title),
    [],
  );

  return { recentPages, addRecentPage };
}
