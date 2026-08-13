"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
        style={{
          background:
            "radial-gradient(60% 60% at 50% 0%, var(--brand-sky-light) 0%, transparent 70%), radial-gradient(40% 40% at 85% 10%, var(--brand-sky) 0%, transparent 70%)",
        }}
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center sm:px-6 sm:pt-32 sm:pb-28">
        <span className="rounded-full border border-border bg-background px-3 py-1 text-[13px] font-medium text-muted-foreground">
          {t("marketing.studio")}
        </span>
        <h1 className="mt-6 text-[32px] leading-[1.15] font-semibold tracking-tight text-balance">
          {t("marketing.heroTitle")}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-balance">
          {t("marketing.heroIntro")}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button size="lg" render={<a href="#packages" />}>
            {t("marketing.seePackages")}
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline" render={<a href="#contact" />}>
            {t("marketing.customBuild")}
          </Button>
        </div>
      </div>
    </section>
  );
}
