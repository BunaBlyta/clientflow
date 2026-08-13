"use client";

import { CircleDot, CreditCard, MessageSquare, Rocket } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const steps = [
  {
    icon: CircleDot,
    title: "marketing.stepRequest",
    description: "marketing.stepRequestDescription",
  },
  {
    icon: CreditCard,
    title: "marketing.stepApprove",
    description: "marketing.stepApproveDescription",
  },
  {
    icon: MessageSquare,
    title: "marketing.stepTrack",
    description: "marketing.stepTrackDescription",
  },
  {
    icon: Rocket,
    title: "marketing.stepLaunch",
    description: "marketing.stepLaunchDescription",
  },
];

export function ProcessSection() {
  const { t } = useLocale();
  return (
    <section id="how-it-works" className="border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("marketing.howItWorks")}</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t("marketing.howItWorksIntro")}
          </p>
        </div>
        <div className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
              <div key={step.title}>
              <div className="flex items-center gap-2 text-brand-accent">
                <step.icon className="size-4" />
                <span className="text-[13px] font-medium">{t("marketing.step", { number: i + 1 })}</span>
              </div>
              <h3 className="mt-3 text-[15px] font-medium">{t(step.title)}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                {t(step.description)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
