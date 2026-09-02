import type { Locale } from "@/lib/locales";
import { DEFAULT_LOCALE } from "@/lib/locales";
import type { TranslatableLocale } from "@/lib/package-translations";
import type { ManagedPackage } from "@/lib/types";

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** `t()` echoes the key back when a message is missing, which is our "no translation" signal. */
function translated(t: Translate, key: string): string | null {
  const value = t(key);
  return value === key ? null : value;
}

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
export function packageName(t: Translate, pkg: ManagedPackage, locale: Locale): string {
  return override(pkg, locale, "name") ?? pkg.name;
}

export function packageDescription(t: Translate, pkg: ManagedPackage, locale: Locale): string {
  const base = override(pkg, locale, "description") ?? pkg.description;
  // The trailing marketing blurb is fixed copy, not customer data, so it stays
  // in the message catalogue keyed by slug.
  const extension = translated(t, `packages.${pkg.slug}.extension`);
  return extension ? `${base} ${extension}` : base;
}

/** "6–8 weeks" → "6–8 Wochen". Only the unit is translated; the range is data. */
export function packageDuration(t: Translate, duration: string): string {
  return duration.replace(/\b(weeks|week)\b/gi, (match) =>
    t(match.toLowerCase() === "week" ? "marketing.week" : "marketing.weeks"),
  );
}
