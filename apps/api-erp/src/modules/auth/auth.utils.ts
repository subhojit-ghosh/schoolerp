export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
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
