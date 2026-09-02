import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { PackagesAndRequest } from "@/components/marketing/packages-and-request";
import { ProcessSection } from "@/components/marketing/process-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
import { ContactForm } from "@/components/marketing/contact-form";
import { siteDescription, siteName, siteTitle, siteUrl } from "@/lib/site";

/**
 * Title and description only. A page-level `openGraph` block would replace the
 * root one wholesale, dropping the generated `opengraph-image`, `og:site_name`
 * and `og:locale` with it — the root layout already carries the right values.
 */
export const metadata: Metadata = {
  // `absolute` so the root `%s | Clientflow` template does not append the brand
  // to a title that already opens with it.
  title: { absolute: siteTitle },
  description: siteDescription,
  alternates: { canonical: "/" },
};

/**
 * Structured data for the public site. Kept to claims the page actually makes —
 * no ratings, no invented organization details.
 */
const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${siteUrl}/#website`,
      url: `${siteUrl}/`,
      name: siteName,
      description: siteDescription,
      inLanguage: ["en", "de", "sq"],
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

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <Hero />
      <PackagesAndRequest />
      <ProcessSection />
      <MobileAppSection />
      <ContactForm />
    </>
  );
}
