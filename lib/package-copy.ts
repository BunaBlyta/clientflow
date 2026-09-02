import type { ManagedPackage } from "@/lib/types";

type Translate = (key: string, values?: Record<string, string | number>) => string;

/** `t()` echoes the key back when a message is missing, which is our "no translation" signal. */
function translated(t: Translate, key: string): string | null {
  const value = t(key);
  return value === key ? null : value;
}

/**
 * Package name, description and delivery estimate are database columns that
 * staff can edit from the dashboard, so English deliberately keeps whatever is
 * stored. German and Albanian use a translation when one exists for that slug
 * and fall back to the stored English text otherwise — a package added later
 * still renders, just untranslated.
 */
export function packageName(t: Translate, pkg: ManagedPackage): string {
  return translated(t, `packages.${pkg.slug}.name`) ?? pkg.name;
}

export function packageDescription(t: Translate, pkg: ManagedPackage): string {
  const base = translated(t, `packages.${pkg.slug}.description`) ?? pkg.description;
  const extension = translated(t, `packages.${pkg.slug}.extension`);
  return extension ? `${base} ${extension}` : base;
}

/** "6–8 weeks" → "6–8 Wochen". Only the unit is translated; the range is data. */
export function packageDuration(t: Translate, duration: string): string {
  return duration.replace(/\b(weeks|week)\b/gi, (match) =>
    t(match.toLowerCase() === "week" ? "marketing.week" : "marketing.weeks"),
  );
}
