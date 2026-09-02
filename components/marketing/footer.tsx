"use client";

import Link from "next/link";
import { useLocale } from "@/lib/i18n";

export function Footer() {
  const { t } = useLocale();
  return (
    <footer className="marketing-footer border-t border-border">
      <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[13px] text-muted-foreground">
          {t("marketing.rights", { year: new Date().getFullYear() })}
        </p>
        <div className="flex items-center gap-6">
          <a href="#packages" className="text-[13px] text-muted-foreground hover:text-foreground">
          {t("nav.packages")}
          </a>
          <a href="#contact" className="text-[13px] text-muted-foreground hover:text-foreground">
            {t("nav.contact")}
          </a>
          <Link href="/login" className="text-[13px] text-muted-foreground hover:text-foreground">
            {t("nav.staffLogin")}
          </Link>
        </div>
      </div>
    </footer>
  );
}
