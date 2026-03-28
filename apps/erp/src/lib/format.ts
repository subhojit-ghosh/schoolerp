/**
 * Shared formatting utilities for the ERP app.
 *
 * Centralises Indian locale formatting so individual pages
 * do not duplicate Intl constructors.
 */

const LOCALE = "en-IN";

/* ------------------------------------------------------------------ */
/*  Currency                                                          */
/* ------------------------------------------------------------------ */

const rupeeFormatter = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const rupeeFormatterFixed = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paise amount as ₹ with Indian grouping (lakhs/crores). */
export function formatRupees(amountInPaise: number): string {
  return rupeeFormatter.format(amountInPaise / 100);
}

/** Same as formatRupees but always shows 2 decimal places. */
export function formatRupeesFixed(amountInPaise: number): string {
  return rupeeFormatterFixed.format(amountInPaise / 100);
}

/** Format basis points (e.g. 1250) as "12.50%". */
export function formatBasisPointsToPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

/* ------------------------------------------------------------------ */
/*  Dates                                                             */
/* ------------------------------------------------------------------ */

const fullDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(LOCALE, {
  dateStyle: "medium",
  timeStyle: "short",
});

const relativeFormatter = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

/** Format a Date as "Friday, 28 March 2026". */
export function formatFullDate(date: Date): string {
  return fullDateFormatter.format(date);
}

/** Format an ISO date string as "28 Mar 2026". */
export function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

/** Format an ISO datetime string as "28 Mar 2026, 3:45 pm". */
export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value));
}

/** Human-friendly relative time: "2 hours ago", "in 3 days", etc. */
export function formatRelativeTime(dateString: string): string {
  const diffMs = new Date(dateString).getTime() - Date.now();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (Math.abs(diffHours) < 24) {
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    return relativeFormatter.format(diffMinutes, "minute");
  }

  const diffDays = Math.round(diffHours / 24);
  return relativeFormatter.format(diffDays, "day");
}

/* ------------------------------------------------------------------ */
/*  Academic year                                                     */
/* ------------------------------------------------------------------ */

/**
 * Format an academic year as "2025-26" from two ISO date strings
 * or a stored name like "2025-2026".
 *
 * Accepts:
 *  - formatAcademicYear("2025-04-01", "2026-03-31") → "2025-26"
 *  - formatAcademicYear("2025-2026")                → "2025-26"
 *  - formatAcademicYear("2025-26")                  → "2025-26" (no-op)
 */
export function formatAcademicYear(
  startDateOrName: string,
  endDate?: string,
): string {
  if (endDate) {
    const startYear = startDateOrName.slice(0, 4);
    const endYear = endDate.slice(0, 4);
    if (!startYear || !endYear) return "";
    if (startYear === endYear) return startYear;
    return `${startYear}-${endYear.slice(2)}`;
  }

  // Single string: "2025-2026" → "2025-26", "2025-26" → "2025-26"
  const match = startDateOrName.match(/^(\d{4})-(\d{2,4})$/);
  if (match) {
    const [, start, end] = match;
    const shortEnd = end.length === 4 ? end.slice(2) : end;
    return `${start}-${shortEnd}`;
  }

  return startDateOrName;
}

/* ------------------------------------------------------------------ */
/*  Phone numbers                                                     */
/* ------------------------------------------------------------------ */

/**
 * Format a 10-digit Indian mobile number as "+91 XXXXX-XXXXX".
 * If the number is already prefixed with +91 or 91, handles that too.
 * Returns the original string if it doesn't look like an Indian mobile.
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  let mobile: string;
  if (digits.length === 12 && digits.startsWith("91")) {
    mobile = digits.slice(2);
  } else if (digits.length === 10) {
    mobile = digits;
  } else {
    return phone;
  }

  return `+91 ${mobile.slice(0, 5)}-${mobile.slice(5)}`;
}

/**
 * Format a phone number for display in compact spaces (tables, badges).
 * Returns "XXXXX-XXXXX" without the country code.
 */
export function formatPhoneCompact(phone: string): string {
  const digits = phone.replace(/\D/g, "");

  let mobile: string;
  if (digits.length === 12 && digits.startsWith("91")) {
    mobile = digits.slice(2);
  } else if (digits.length === 10) {
    mobile = digits;
  } else {
    return phone;
  }

  return `${mobile.slice(0, 5)}-${mobile.slice(5)}`;
}

/* ------------------------------------------------------------------ */
/*  Names                                                             */
/* ------------------------------------------------------------------ */

export const HONORIFICS = [
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Shri",
  "Smt.",
  "Prof.",
] as const;

export type Honorific = (typeof HONORIFICS)[number];

/** Prepend honorific to a name when present: "Dr. John Smith". */
export function formatNameWithHonorific(
  name: string,
  honorific?: string | null,
): string {
  if (honorific) {
    return `${honorific} ${name}`;
  }

  return name;
}

/* ------------------------------------------------------------------ */
/*  Month labels                                                      */
/* ------------------------------------------------------------------ */

export const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Format month (1-based) + year as "April 2026". */
export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}
