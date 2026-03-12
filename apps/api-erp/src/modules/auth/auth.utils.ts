const SHORT_NAME_MAX_WORDS = 2;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function normalizeOptionalEmail(value: string | undefined) {
  return value ? normalizeEmail(value) : null;
}

export function normalizeMobile(value: string) {
  return value.replace(/\D/g, "");
}

export function isEmailIdentifier(value: string) {
  return value.includes("@");
}

export function readCookieValue(cookies: unknown, name: string) {
  if (!cookies || typeof cookies !== "object") {
    return undefined;
  }

  const cookieRecord = cookies as Record<string, unknown>;
  const value = cookieRecord[name];

  return typeof value === "string" ? value : undefined;
}

export function slugifyValue(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function deriveShortName(value: string) {
  return value.trim().split(/\s+/).slice(0, SHORT_NAME_MAX_WORDS).join(" ");
}
