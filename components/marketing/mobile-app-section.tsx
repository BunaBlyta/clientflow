"use client";

import { Bell, ReceiptText, Smartphone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const featureKeys = ["marketing.liveTracker", "marketing.securePayment", "marketing.pushUpdates"];

export function MobileAppSection() {
  const { t } = useLocale();
  return (
    <section className="mobile-app-section">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">
            {t("marketing.trackPhone")}
          </h2>
          <p className="mt-2 max-w-md text-[14px] text-muted-foreground">
            {t("marketing.trackPhoneIntro")}
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {[
              { icon: Smartphone, key: featureKeys[0] },
              { icon: ReceiptText, key: featureKeys[1] },
              { icon: Bell, key: featureKeys[2] },
            ].map((item) => (
              <li key={item.key} className="flex items-center gap-2.5 text-[14px]">
                <item.icon className="project-feature-icon size-4 rounded-sm bg-brand-sky/20 p-0.5 text-foreground dark:bg-brand-accent/25 dark:text-foreground" />
                {t(item.key)}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <span
              aria-label="Download on the App Store — coming soon"
              className="store-badge app-store-badge flex h-12 min-w-[148px] items-center gap-2 rounded-[7px] border border-white/15 bg-[#050505] px-3 text-white shadow-sm"
            >
              <img
                src="https://cdn.simpleicons.org/apple/FFFFFF"
                alt=""
                aria-hidden="true"
                className="size-6 shrink-0"
              />
              <span className="flex flex-col leading-none">
                <span className="store-badge-kicker text-[9px] tracking-wide text-white/75">Download on the</span>
                <span className="store-badge-title mt-1 text-[17px] font-medium tracking-[-0.03em]">App Store</span>
              </span>
            </span>
            <span
              aria-label="Get it on Google Play — coming soon"
              className="store-badge google-play-badge flex h-12 min-w-[148px] items-center gap-2 rounded-[7px] border border-white/15 bg-[#050505] px-3 text-white shadow-sm"
            >
              <img
                src="https://cdn.simpleicons.org/googleplay/FFFFFF"
                alt=""
                aria-hidden="true"
                className="size-6 shrink-0"
              />
              <span className="flex flex-col leading-none">
                <span className="store-badge-kicker text-[9px] tracking-wide text-white/75">GET IT ON</span>
                <span className="store-badge-title mt-1 text-[17px] font-medium tracking-[-0.03em]">Google Play</span>
              </span>
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[280px]">
          <div className="project-preview-frame group/project-preview rounded-[32px] border border-border bg-brand-sky/15 p-3 shadow-[0_22px_44px_-30px_color-mix(in_oklch,var(--brand-accent)_68%,transparent)] dark:border-brand-accent/15 dark:bg-brand-accent/6">
            <div className="flex flex-col gap-3 rounded-[24px] border border-border/80 bg-background p-4 dark:border-brand-accent/20">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium">Marlowe &amp; Finch</span>
                <span className="rounded-full bg-brand-accent/10 px-2 py-0.5 text-[11px] font-medium text-brand-accent">
                  Design
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {["Discovery", "Design", "Development", "Review", "Launched"].map((stage, i) => (
                  <div
                    key={stage}
                    className={
                      i <= 1
                        ? "project-stage-bar h-1.5 flex-1 rounded-full bg-brand-accent transition-colors duration-300"
                        : "project-stage-bar h-1.5 flex-1 rounded-full bg-muted transition-colors duration-300 group-hover/project-preview:bg-brand-accent"
                    }
                  />
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2 border-t border-border pt-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{t("marketing.deposit")}</span>
                  <span className="font-medium text-status-success">{t("status.invoice.PAID")}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-muted-foreground">{t("marketing.finalPayment")}</span>
                  <span className="font-medium text-muted-foreground">{t("marketing.notDue")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
