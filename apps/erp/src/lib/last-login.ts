const STORAGE_KEY = "erp:lastLoginAt";

/** Persist the current timestamp as the last login time. */
export function recordLastLogin(): void {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

/** Read the stored last login timestamp, or null if none exists. */
export function getLastLogin(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}
