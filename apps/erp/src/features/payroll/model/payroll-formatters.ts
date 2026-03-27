import { MONTH_LABELS } from "./payroll-constants";

export function formatPaiseToRupees(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(paise / 100);
}

export function formatBasisPointsToPercent(basisPoints: number): string {
  return `${(basisPoints / 100).toFixed(2)}%`;
}

export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_LABELS[month - 1]} ${year}`;
}
