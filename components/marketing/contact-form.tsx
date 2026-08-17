"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="required-mark" aria-hidden="true">*</span>
    </Label>
  );
}

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
      <div className="mx-auto grid max-w-6xl items-start gap-8 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <div className="self-start text-left">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-[22px]">
            {t("marketing.customBuildTitle")}
          </h2>
          <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
            {t("marketing.customBuildIntro")}
          </p>
        </div>

        {submitted ? (
          <div className="contact-form-card rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            <p className="text-[14px] font-medium">{t("marketing.thanksInquiry")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("marketing.thanksInquiryIntro")}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              {t("marketing.sendAnotherInquiry")}
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="contact-form-card flex flex-col gap-4 rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            {error && (
              <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <RequiredLabel htmlFor="contact-name">{t("marketing.yourName")}</RequiredLabel>
                <Input id="contact-name" name="name" required placeholder={t("marketing.namePlaceholder")} className="contact-field" />
              </div>
              <div className="flex flex-col gap-1.5">
                <RequiredLabel htmlFor="contact-email">{t("auth.email")}</RequiredLabel>
                <Input id="contact-email" name="email" type="email" required placeholder={t("marketing.emailPlaceholder")} className="contact-field" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <RequiredLabel htmlFor="contact-message">{t("marketing.whatBuild")}</RequiredLabel>
              <Textarea
                id="contact-message"
                name="message"
                required
                rows={5}
                placeholder={t("marketing.buildPlaceholder")}
                className="contact-field max-h-56 resize-y overflow-y-auto"
              />
            </div>
            <Button type="submit" disabled={pending} className="mt-2 self-start">
              {pending ? t("common.sending") : t("marketing.sendInquiry")}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}
