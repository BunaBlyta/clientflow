"use client";

import { Button } from "@/components/ui/button";
import { CustomBuildDialog } from "@/components/marketing/custom-build-dialog";
import { ArrowRight } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function Hero() {
  const { t } = useLocale();
  return (
    <section className="hero-section relative flex min-h-[calc(100svh-4rem)] items-center overflow-hidden">
      <div className="hero-gradient pointer-events-none absolute inset-x-0 top-0 z-0 h-[560px]" />
      <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6 sm:py-32">
        <h1 className="hero-title max-w-[24ch] whitespace-pre-line text-[32px] leading-[1.1] font-semibold tracking-tight text-balance">
          {t("marketing.heroTitle")}
        </h1>
        <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted-foreground text-balance">
          {t("marketing.heroIntro")}
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" className="h-9" render={<a href="#packages" />}>
            {t("marketing.seePackages")}
            <ArrowRight />
          </Button>
          <CustomBuildDialog
            trigger={
              <Button size="lg" variant="outline" className="h-9">
                {t("marketing.customBuild")}
                <ArrowRight />
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}
