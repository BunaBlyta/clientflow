"use client";

import { Button } from "@/components/ui/button";
import { useLocale } from "@/lib/i18n";
import { CustomBuildDialog } from "@/components/marketing/custom-build-dialog";

export function ContactForm() {
  const { t } = useLocale();

  return (
    <section id="contact" className="custom-build-gradient relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div className="self-start text-left">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
            {t("marketing.customBuildTitle")}
          </h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {t("marketing.customBuildIntro")}
          </p>
        </div>

        <div className="flex items-start justify-start lg:justify-end">
          <CustomBuildDialog
            trigger={
              <Button size="lg" className="w-full sm:w-auto">
                {t("marketing.customBuild")}
              </Button>
            }
          />
        </div>
      </div>
    </section>
  );
}
