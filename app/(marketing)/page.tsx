import { Hero } from "@/components/marketing/hero";
import { PackagesAndRequest } from "@/components/marketing/packages-and-request";
import { ProcessSection } from "@/components/marketing/process-section";
import { MobileAppSection } from "@/components/marketing/mobile-app-section";
import { ContactForm } from "@/components/marketing/contact-form";

export default function HomePage() {
  return (
    <>
      <Hero />
      <PackagesAndRequest />
      <ProcessSection />
      <MobileAppSection />
      <ContactForm />
    </>
  );
}
