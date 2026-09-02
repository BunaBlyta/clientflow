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
