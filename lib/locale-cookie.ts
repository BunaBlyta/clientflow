/**
 * The locale preference, mirrored from the Zustand store into a cookie.
 *
 * `localStorage` is invisible to the server, so it cannot decide what `/` should
 * serve. This cookie is what lets the middleware send a visitor who has already
 * picked German or Albanian straight to `/de` or `/sq`, while `/` stays English
 * for anyone without one — crawlers included.
 *
 * Imported by the middleware, so this module must stay free of client-only and
 * Node-only APIs.
 */

export const LOCALE_COOKIE = "clientflow_locale";

/** A year. The preference is a convenience, not something to re-ask about often. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function persistLocaleCookie(locale: string) {
  if (typeof document === "undefined") return;
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax${secure}`;
}
