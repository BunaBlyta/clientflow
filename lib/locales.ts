/**
 * Locale constants, deliberately kept out of `lib/i18n.tsx`.
 *
 * That file is `"use client"`, so anything a server module imports from it
 * arrives as a client-reference proxy rather than a real value — `LOCALES.map`
 * is not a function on the server. Metadata, the sitemap, and the route
 * segments all need these at build time, so they live in a plain module and
 * `lib/i18n` re-exports them for client code.
 */

export const LOCALES = ["en", "de", "sq"] as const;

export type Locale = (typeof LOCALES)[number];

/**
 * English is served from the bare root, so it never carries a URL prefix.
 *
 * Typed as the literal rather than `Locale`, so `Exclude<Locale, typeof
 * DEFAULT_LOCALE>` names the other locales instead of collapsing to `never`.
 */
export const DEFAULT_LOCALE = "en" satisfies Locale;

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** `/` for English, `/de` and `/sq` for the rest. */
export function localeHomePath(locale: Locale): string {
  return locale === DEFAULT_LOCALE ? "/" : `/${locale}`;
}
