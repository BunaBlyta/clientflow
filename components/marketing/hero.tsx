"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <div className="hero-gradient pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px]" />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 pt-24 pb-20 text-center sm:px-6 sm:pt-32 sm:pb-28">
        <h1 className="text-[32px] leading-[1.15] font-semibold tracking-tight text-balance">
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
