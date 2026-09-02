import type { MetadataRoute } from "next";
import { LOCALES, localeHomePath } from "@/lib/locales";
import { siteUrl } from "@/lib/site";

/**
 * One entry per locale, each declaring the full alternate set — the sitemap
 * mirror of the hreflang tags on the pages themselves.
 *
 * The marketing site's sections (`#packages`, `#how-it-works`, `#contact`) are
 * anchors on these pages, not routes, so they are deliberately not listed as
 * separate URLs. Add entries here if it ever grows real pages.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const languages = Object.fromEntries(
    LOCALES.map((locale) => [locale, `${siteUrl}${localeHomePath(locale)}`]),
  );

  return LOCALES.map((locale) => ({
    url: `${siteUrl}${localeHomePath(locale)}`,
    lastModified,
    changeFrequency: "monthly",
    priority: locale === "en" ? 1 : 0.8,
    alternates: { languages },
  }));
}
