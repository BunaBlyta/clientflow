"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelect } from "@/components/language-select";
import { useLocale } from "@/lib/i18n";

const links = [
  { href: "#packages", key: "nav.packages" },
  { href: "#how-it-works", key: "nav.howItWorks" },
  { href: "#contact", key: "nav.contact" },
];

export function Navbar() {
  const { t } = useLocale();
  return (
    <header className="marketing-header sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="relative flex h-16 w-full items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <BrandLogo />
          Clientflow
        </Link>
        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-10 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-[15px] font-normal text-muted-foreground transition-colors hover:text-foreground"
            >
              {t(link.key)}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <LanguageSelect compact />
            <ThemeToggle />
          </div>
          <Link
            href="/login"
            className="marketing-staff-login hidden text-[15px] font-normal text-muted-foreground hover:text-foreground sm:inline"
          >
            {t("nav.staffLogin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
