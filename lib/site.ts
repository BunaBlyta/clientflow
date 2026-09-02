import type { Locale } from "@/lib/locales";

/**
 * Canonical site identity, shared by every metadata surface.
 *
 * The origin follows the same convention the rest of the server uses
 * (`APP_URL`, see `app/api/_lib/verification-email.ts` and the Stripe checkout
 * route), falling back to the Vercel production domain so preview builds and
 * local `next build` still emit absolute URLs instead of relative ones.
 */

const FALLBACK_SITE_URL = "https://clientflow-ijdn.vercel.app";

function normalizeOrigin(url: string) {
  return url.trim().replace(/\/+$/, "");
}

const configuredOrigin =
  process.env.APP_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  FALLBACK_SITE_URL;

export const siteUrl = normalizeOrigin(configuredOrigin);

export const siteName = "Clientflow";

export const siteTagline = "A clear path from request to launch";

export const siteDescription =
  "Pick a package, request a project, and follow it from the first conversation to launch — with invoices, updates, and a mobile app that keeps you posted.";

export const siteTitle = `${siteName} — ${siteTagline}`;

/**
 * Title and description per locale, for the three marketing URLs.
 *
 * Kept here rather than in the `lib/i18n` message maps because these strings are
 * only ever read on the server, while those maps ship to the browser.
 */
export const localizedSiteCopy: Record<Locale, { title: string; description: string; ogLocale: string }> = {
  en: {
    title: siteTitle,
    description: siteDescription,
    ogLocale: "en_US",
  },
  de: {
    title: `${siteName} — Ein klarer Weg von der Anfrage bis zum Launch`,
    description:
      "Wähle ein Paket, stelle eine Projektanfrage und verfolge sie vom ersten Gespräch bis zum Launch — mit Rechnungen, Updates und einer App, die dich auf dem Laufenden hält.",
    ogLocale: "de_DE",
  },
  sq: {
    title: `${siteName} — Një rrugë e qartë nga kërkesa te lançimi`,
    description:
      "Zgjidh një paketë, dërgo një kërkesë projekti dhe ndiqe nga biseda e parë deri te lançimi — me fatura, përditësime dhe një aplikacion që të mban të informuar.",
    ogLocale: "sq_AL",
  },
};
