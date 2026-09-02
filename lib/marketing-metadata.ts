import type { Metadata } from "next";
import { DEFAULT_LOCALE, LOCALES, type Locale, localeHomePath } from "@/lib/locales";
import { localizedSiteCopy, siteDescription, siteName, siteUrl } from "@/lib/site";

/**
 * hreflang for the three marketing URLs. Every locale advertises every other
 * one, including itself — a reciprocal set is what search engines expect — and
 * `x-default` points at the English root, which is also the canonical URL.
 */
const languageAlternates: Record<string, string> = {
  ...Object.fromEntries(LOCALES.map((locale) => [locale, localeHomePath(locale)])),
  "x-default": localeHomePath(DEFAULT_LOCALE),
};

export function marketingMetadata(locale: Locale): Metadata {
  const copy = localizedSiteCopy[locale];

  return {
    // `absolute` so the root `%s | Clientflow` template does not append the
    // brand to a title that already opens with it.
    title: { absolute: copy.title },
    description: copy.description,
    alternates: {
      canonical: localeHomePath(locale),
      languages: languageAlternates,
    },
    openGraph: {
      type: "website",
      url: localeHomePath(locale),
      siteName,
      title: copy.title,
      description: copy.description,
      locale: copy.ogLocale,
      alternateLocale: LOCALES.filter((item) => item !== locale).map((item) => localizedSiteCopy[item].ogLocale),
      // The generated `opengraph-image` lives at the app root, and a page-level
      // `openGraph` block replaces the root one wholesale — so name it here or
      // these pages would ship no `og:image` at all.
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: copy.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: copy.title,
      description: copy.description,
      images: ["/opengraph-image"],
    },
  };
}

/**
 * Structured data for the public site. Kept to claims the page actually makes —
 * no ratings, no invented organization details.
 */
export function marketingStructuredData(locale: Locale) {
  const copy = localizedSiteCopy[locale];
  const pageUrl = `${siteUrl}${localeHomePath(locale)}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        url: `${siteUrl}/`,
        name: siteName,
        description: siteDescription,
        inLanguage: [...LOCALES],
      },
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: copy.title,
        description: copy.description,
        inLanguage: locale,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: { "@id": `${siteUrl}/#app` },
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${siteUrl}/#app`,
        name: siteName,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, iOS, Android",
        url: `${siteUrl}/`,
        description:
          "Client and project management for a web design studio: a staff dashboard for clients, projects, invoices and analytics, and a mobile app where clients request work, track project stages, and pay.",
        featureList: [
          "Project request intake and approval",
          "Project stage tracking from discovery to launch",
          "Invoicing with Stripe payments",
          "Shared per-project note feed",
          "Revenue and turnaround analytics",
          "Push notifications for status changes",
        ],
      },
    ],
  };
}
