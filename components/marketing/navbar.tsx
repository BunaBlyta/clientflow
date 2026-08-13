"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";

const links = [
  { href: "#packages", key: "nav.packages" },
  { href: "#how-it-works", key: "nav.howItWorks" },
  { href: "#contact", key: "nav.contact" },
];

export function Navbar() {
  const { t } = useLocale();
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-[15px] font-semibold tracking-tight">
          Clientflow
        </Link>
        <nav className="hidden items-center gap-10 md:flex">
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
        <div className="flex items-center gap-5 sm:gap-6">
          <Link
            href="/login"
            className="hidden text-[15px] font-normal text-muted-foreground hover:text-foreground sm:inline"
          >
            {t("nav.staffLogin")}
          </Link>
          <Button size="sm" render={<a href="#packages" />}>
            {t("nav.startProject")}
          </Button>
        </div>
      </div>
    </header>
  );
}
