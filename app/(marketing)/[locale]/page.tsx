import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { DEFAULT_LOCALE, LOCALES, isLocale } from "@/lib/locales";
import { marketingMetadata } from "@/lib/marketing-metadata";

/**
 * Only the prefixed locales are real routes. Without this, `[locale]` would
 * happily render the homepage under any single-segment URL — `/pricing`,
 * `/asdf` — and hand search engines a pile of duplicate pages.
 *
 * Static routes still win over this dynamic one, so `/login`, `/dashboard`,
 * `/payment/*` and `/api/*` are unaffected.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return LOCALES.filter((locale) => locale !== DEFAULT_LOCALE).map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? marketingMetadata(locale) : {};
}

export default async function LocalizedHomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  // English is canonical at `/`, so `/en` is not a second address for it.
  if (!isLocale(locale) || locale === DEFAULT_LOCALE) notFound();
  return <MarketingShell locale={locale} />;
}
