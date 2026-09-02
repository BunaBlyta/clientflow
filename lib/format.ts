import type { Locale } from "@/lib/locales";

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function formatMajorCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount);
}

export const INTL_LOCALE: Record<Locale, string> = {
  en: "en-US",
  de: "de-DE",
  sq: "sq-AL",
};

const MONTH_STYLE: Record<Locale, "short" | "long"> = {
  en: "short",
  de: "short",
  sq: "long",
};

/**
 * Albanian is formatted by hand, not through Intl.
 *
 * Not every browser ships Albanian locale data — Chrome 151 resolves `sq-AL`
 * to `en-US` and silently returns English month names — and Node does, so the
 * gap never shows up in tests. Spelling the months out here makes the output
 * identical everywhere, and full month names are what was asked for: the
 * abbreviations ("mar" for both mars and…) read as ambiguous.
 */
const ALBANIAN_MONTHS = [
  "janar", "shkurt", "mars", "prill", "maj", "qershor",
  "korrik", "gusht", "shtator", "tetor", "nëntor", "dhjetor",
] as const;

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (locale === "sq") {
    return `${date.getDate()} ${ALBANIAN_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  }
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: MONTH_STYLE[locale],
    day: "numeric",
    year: "numeric",
  }).format(date);
}

/** Weekday initials for the calendar header, Monday first. */
const WEEKDAY_INITIALS: Record<Locale, readonly string[]> = {
  en: ["M", "T", "W", "T", "F", "S", "S"],
  de: ["M", "D", "M", "D", "F", "S", "S"],
  sq: ["H", "M", "M", "E", "P", "Sh", "D"],
};

export function weekdayInitials(locale: Locale): readonly string[] {
  return WEEKDAY_INITIALS[locale];
}

/** The month name on its own, for a calendar header. */
export function formatMonthLong(date: Date, locale: Locale): string {
  if (locale === "sq") {
    const name = ALBANIAN_MONTHS[date.getMonth()];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "long" }).format(date);
}

/** The abbreviated month, for chart axes. */
export function formatMonthShort(date: Date, locale: Locale): string {
  if (locale === "sq") return ALBANIAN_MONTHS[date.getMonth()].slice(0, 3);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], { month: "short" }).format(date);
}

export function formatShortDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (locale === "sq") return `${date.getDate()} ${ALBANIAN_MONTHS[date.getMonth()]}`;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: MONTH_STYLE[locale],
    day: "numeric",
  }).format(date);
}

export function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
