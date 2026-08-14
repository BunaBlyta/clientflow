"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

export function ContactForm() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.get("name"),
          email: values.get("email"),
          message: values.get("message"),
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;
      if (!response.ok) {
        throw new Error(typeof result?.error === "string" ? result.error : t("dashboard.retryLoad"));
      }

      form.reset();
      setSubmitted(true);
      toast.success(t("marketing.inquirySent"), { description: t("marketing.inquirySentIntro") });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : t("dashboard.retryLoad"));
    } finally {
      setPending(false);
    }
  }

  return (
    <section id="contact" className="custom-build-gradient relative isolate overflow-hidden">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-stretch lg:gap-16">
        <div className="flex flex-col justify-center pt-2 text-left">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">{t("marketing.customBuildTitle")}</h2>
          <p className="mt-2 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {t("marketing.customBuildIntro")}
          </p>
        </div>

        {submitted ? (
          <div className="premium-card contact-form-card rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <p className="text-[14px] font-medium">{t("marketing.thanksInquiry")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("marketing.thanksInquiryIntro")}
            </p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              {t("marketing.sendAnotherInquiry")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="premium-card contact-form-card flex flex-col gap-4 rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-name">{t("marketing.yourName")}</Label>
                <Input id="contact-name" name="name" required placeholder={t("marketing.namePlaceholder")} className="contact-field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="contact-email">{t("auth.email")}</Label>
                <Input id="contact-email" name="email" type="email" required placeholder={t("marketing.emailPlaceholder")} className="contact-field" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="contact-message">{t("marketing.whatBuild")}</Label>
              <Textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder={t("marketing.buildPlaceholder")}
                className="contact-field"
              />
            </div>
            {error && (
              <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                {error}
              </p>
            )}
            <Button type="submit" disabled={pending} className="mt-2 self-start">
              {pending ? t("common.sending") : t("marketing.sendInquiry")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
