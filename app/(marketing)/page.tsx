import type { Metadata } from "next";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { DEFAULT_LOCALE } from "@/lib/locales";
import { marketingMetadata } from "@/lib/marketing-metadata";

export const metadata: Metadata = marketingMetadata(DEFAULT_LOCALE);

/** English lives at the bare root; `/de` and `/sq` are handled by `[locale]`. */
export default function HomePage() {
  return <MarketingShell locale={DEFAULT_LOCALE} />;
}
