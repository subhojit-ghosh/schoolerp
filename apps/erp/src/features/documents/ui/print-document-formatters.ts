export function formatDocumentDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDocumentDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDocumentReference(prefix: string, value: string) {
  const compact = value.replace(/-/g, "").slice(-8).toUpperCase();

  return `${prefix}-${compact}`;
}
