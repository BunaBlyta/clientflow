import type { Locale } from "@/lib/locales";
import { DEFAULT_LOCALE } from "@/lib/locales";
import type { TranslatableLocale } from "@/lib/package-translations";
import type { ManagedPackage } from "@/lib/types";

type Translate = (key: string, values?: Record<string, string | number>) => string;

function override(pkg: ManagedPackage, locale: Locale, field: "name" | "description"): string | null {
  if (locale === DEFAULT_LOCALE) return null;
  return pkg.translations?.[locale as TranslatableLocale]?.[field]?.trim() || null;
}

/**
 * Package name and description are editable database columns, and so are their
 * German and Albanian versions — staff maintain all of them from Settings.
 *
 * English always comes from the `name`/`description` columns; another locale
 * uses its stored override when there is one and falls back to English per
 * field, so a half-translated package still reads sensibly.
 */
export function packageName(pkg: ManagedPackage, locale: Locale): string {
  return override(pkg, locale, "name") ?? pkg.name;
}

export function packageDescription(pkg: ManagedPackage, locale: Locale): string {
  return override(pkg, locale, "description") ?? pkg.description;
}

/** "6–8 weeks" → "6–8 Wochen". Only the unit is translated; the range is data. */
export function packageDuration(t: Translate, duration: string): string {
  return duration.replace(/\b(weeks|week)\b/gi, (match) =>
    t(match.toLowerCase() === "week" ? "marketing.week" : "marketing.weeks"),
  );
}
