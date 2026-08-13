"use client";

import { Apple, Bell, PlayCircle, ReceiptText, Smartphone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

const featureKeys = ["marketing.liveTracker", "marketing.securePayment", "marketing.pushUpdates"];

export function MobileAppSection() {
  const { t } = useLocale();
  return (
    <section className="border-t border-border">
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
                <item.icon className="size-4 text-brand-accent" />
                {t(item.key)}
              </li>
            ))}
          </ul>
          <div className="mt-7 flex flex-wrap gap-3">
            <span className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] text-muted-foreground">
              <Apple className="size-4" />
              App Store — coming soon
            </span>
            <span className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-[13px] text-muted-foreground">
              <PlayCircle className="size-4" />
              Google Play — coming soon
            </span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[280px]">
          <div className="rounded-[32px] border border-border bg-secondary/40 p-3">
            <div className="flex flex-col gap-3 rounded-[24px] bg-background p-4">
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
                        ? "h-1.5 flex-1 rounded-full bg-brand-accent"
                        : "h-1.5 flex-1 rounded-full bg-muted"
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
