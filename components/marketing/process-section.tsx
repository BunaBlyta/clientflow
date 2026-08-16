"use client";

import { useLocale } from "@/lib/i18n";

type ProcessIconProps = { className?: string };

function SendColorIcon({ className }: ProcessIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M4 14.2 27.5 4.5 18.2 27l-5.1-8.7L4 14.2Z"
        fill="#DDF8FF"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="m13.1 18.3 14.4-13.8-9.4 10.1Z" fill="#5AB2FF" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="m13.1 18.3 5.1 8.7-2.5-9.5Z" fill="#FBBF24" stroke="#111827" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function MoneyColorIcon({ className }: ProcessIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="12" fill="#FBBF24" stroke="#111827" strokeWidth="1.2" />
      <circle cx="16" cy="16" r="8.5" fill="#FDE68A" stroke="#111827" strokeWidth="1.2" />
      <text x="16" y="21.5" textAnchor="middle" fontSize="14" fontWeight="700" fill="#22A06B" stroke="#111827" strokeWidth="0.45">
        $
      </text>
    </svg>
  );
}

function MessageColorIcon({ className }: ProcessIconProps) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M5 7.5A3.5 3.5 0 0 1 8.5 4h15A3.5 3.5 0 0 1 27 7.5v9a3.5 3.5 0 0 1-3.5 3.5H14l-6.5 5v-5.8A3.5 3.5 0 0 1 5 16.5v-9Z"
        fill="#DCCBFF"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle className="process-message-dot" cx="11" cy="12.5" r="1.25" fill="#8174D8" stroke="#111827" strokeWidth="0.7" />
      <circle className="process-message-dot" cx="16" cy="12.5" r="1.25" fill="#8174D8" stroke="#111827" strokeWidth="0.7" />
      <circle className="process-message-dot" cx="21" cy="12.5" r="1.25" fill="#8174D8" stroke="#111827" strokeWidth="0.7" />
    </svg>
  );
}

function RocketColorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M8.5 26.8C8.3 18.9 13.2 8.5 24.7 3.2c1.8-.8 3.6.9 2.9 2.8C23.4 17.4 13.1 24.7 8.5 26.8Z"
        fill="#F4F4F5"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="22.5" cy="9" r="3" fill="#5AB2FF" stroke="#111827" strokeWidth="1.2" />
      <path
        d="M13.8 19.5 6 21.7l3.9-8.2 3.9 2.1Z"
        fill="#F07832"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        d="m17.5 24.1-1.7 6.2-5.1-3.2 2.4-4.1Z"
        fill="#EF4444"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path
        className="process-rocket-flame"
        d="M10.7 25.5c-3.1.2-5.4 1.9-7.2 4.4 3.5.2 6.1-.9 8.1-3.2Z"
        fill="#FBBF24"
        stroke="#111827"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const steps = [
  {
    icon: SendColorIcon,
    title: "marketing.stepRequest",
    description: "marketing.stepRequestDescription",
  },
  {
    icon: MoneyColorIcon,
    title: "marketing.stepApprove",
    description: "marketing.stepApproveDescription",
  },
  {
    icon: MessageColorIcon,
    title: "marketing.stepTrack",
    description: "marketing.stepTrackDescription",
  },
  {
    icon: RocketColorIcon,
    title: "marketing.stepLaunch",
    description: "marketing.stepLaunchDescription",
  },
];

export function ProcessSection() {
  const { t } = useLocale();
  return (
    <section id="how-it-works" className="process-section relative isolate overflow-visible dark:bg-secondary/40">
      <div className="relative z-10 mx-auto max-w-6xl px-4 pt-40 pb-48 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("marketing.howItWorks")}</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t("marketing.howItWorksIntro")}
          </p>
          <span className="process-intro-mark" aria-hidden="true" />
        </div>
        <div className="relative mx-auto mt-10 grid max-w-none gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
              <div key={step.title} className="process-step group relative z-10 text-center">
              {i < steps.length - 1 && (
                <svg
                  className={`process-connector pointer-events-none absolute top-[13px] left-[calc(50%+20px)] z-0 hidden h-3 w-[calc(100%-0.5rem)] overflow-visible text-gray-400/50 dark:text-brand-accent/20 lg:block ${i === steps.length - 1 ? "process-connector-final" : ""}`}
                  viewBox="0 0 100 14"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 7 C 8 -1, 15 15, 22 7 S 36 -1, 43 7 S 57 15, 64 7 S 78 -1, 85 7 S 94 15, 98 7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.75"
                    strokeDasharray="10 9"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              )}
              <div className="process-icon relative z-20 mx-auto flex size-10 items-center justify-center overflow-hidden rounded-full border border-brand-sky/70 bg-transparent text-brand-sky dark:border-brand-accent/40 dark:bg-transparent dark:text-foreground">
                <step.icon className="process-glyph size-5" />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-foreground dark:text-brand-accent">
                <span className="text-[12px] font-medium tracking-wide">{t("marketing.step", { number: i + 1 })}</span>
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
