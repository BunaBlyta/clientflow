import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Hero } from "@/components/marketing/hero";
import { PackagesAndRequest } from "@/components/marketing/packages-and-request";
import { ProcessSection } from "@/components/marketing/process-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
import { ContactForm } from "@/components/marketing/contact-form";
import { RoutedLocaleProvider } from "@/lib/i18n";
import type { Locale } from "@/lib/locales";
import { marketingStructuredData } from "@/lib/marketing-metadata";

/**
 * The whole public page for one locale.
 *
 * The provider wraps the chrome as well as the sections, so the navbar and
 * footer are translated in the server-rendered HTML too. This is what makes the
 * German and Albanian copy visible to crawlers: the locale arrives as a prop
 * from the route rather than from `localStorage` after hydration.
 */
export function MarketingShell({ locale }: { locale: Locale }) {
  return (
    <RoutedLocaleProvider locale={locale}>
      {/*
        `<html lang>` is set by the root layout, which is shared by every route
        and cannot see this segment's params. This corrects it before hydration,
        the same trick the theme script uses.
      */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang=${JSON.stringify(locale)}`,
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(marketingStructuredData(locale)) }}
      />
      <div className="marketing-page flex flex-1 flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <PackagesAndRequest />
          <ProcessSection />
          <MobileAppSection />
          <ContactForm />
        </main>
        <Footer />
      </div>
    </RoutedLocaleProvider>
  );
}
