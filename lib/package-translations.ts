import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/locales";

/**
 * Per-locale package copy, stored on the `Package.translations` column.
 *
 * English is not a key here — it lives in the `name` and `description` columns
 * and is the fallback for anything a locale leaves blank, so a half-filled
 * translation degrades to English one field at a time rather than all at once.
 */
export type PackageTranslation = {
  name?: string;
  description?: string;
};

export type TranslatableLocale = Exclude<Locale, typeof DEFAULT_LOCALE>;

export type PackageTranslations = Partial<Record<TranslatableLocale, PackageTranslation>>;

/** The locales staff can fill in — every locale except the one in the columns. */
export const TRANSLATABLE_LOCALES: readonly TranslatableLocale[] = LOCALES.filter(
  (locale): locale is TranslatableLocale => locale !== DEFAULT_LOCALE,
);

const MAX_FIELD_LENGTH = 2_000;

/**
 * Validates untrusted JSON from the edit form. Returns the cleaned value, or
 * `undefined` when the shape is wrong so the caller can reject the request.
 * Blank fields are dropped rather than stored, and a locale left entirely blank
 * disappears, which is what makes "clear it to go back to English" work.
 */
export function readPackageTranslations(value: unknown): PackageTranslations | null | undefined {
  if (value === null) return null;
  if (typeof value !== "object" || Array.isArray(value)) return undefined;

  const result: PackageTranslations = {};
  for (const [locale, entry] of Object.entries(value as Record<string, unknown>)) {
    if (!TRANSLATABLE_LOCALES.includes(locale as TranslatableLocale)) return undefined;
    if (entry === null || entry === undefined) continue;
    if (typeof entry !== "object" || Array.isArray(entry)) return undefined;

    const cleaned: PackageTranslation = {};
    for (const field of ["name", "description"] as const) {
      const raw = (entry as Record<string, unknown>)[field];
      if (raw === undefined || raw === null) continue;
      if (typeof raw !== "string") return undefined;
      const trimmed = raw.trim();
      if (!trimmed) continue;
      if (trimmed.length > MAX_FIELD_LENGTH) return undefined;
      cleaned[field] = trimmed;
    }
    if (Object.keys(cleaned).length > 0) result[locale as TranslatableLocale] = cleaned;
  }

  return Object.keys(result).length > 0 ? result : null;
}

/** Narrows a value read back from the database. */
export function asPackageTranslations(value: unknown): PackageTranslations {
  const parsed = readPackageTranslations(value);
  return parsed ?? {};
}
