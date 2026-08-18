"use client";

import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

type ContactField = "name" | "email" | "message";

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      <span className="required-mark" aria-hidden="true">*</span>
    </Label>
  );
}

function FieldHint({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <div id={id} role="alert" className="request-field-hint flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[12px] leading-4">
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

export function ContactForm() {
  const { t } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ContactField, string>>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const nextFieldErrors: Partial<Record<ContactField, string>> = {};

    if (!name) nextFieldErrors.name = t("common.required");
    if (!email) {
      nextFieldErrors.email = t("common.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = t("common.invalidEmail");
    }
    if (!message) nextFieldErrors.message = t("common.required");

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/contact-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          message,
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;
      if (!response.ok) {
        throw new Error(typeof result?.error === "string" ? result.error : t("dashboard.retryLoad"));
      }

      form.reset();
      setFieldErrors({});
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

        <form noValidate onSubmit={handleSubmit} className="contact-form-card flex flex-col gap-4 rounded-2xl border border-border bg-background/80 p-6 backdrop-blur-sm sm:p-8">
            {error && (
              <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <RequiredLabel htmlFor="contact-name">{t("marketing.yourName")}</RequiredLabel>
                  <FieldHint id="contact-name-error" message={fieldErrors.name} />
                </div>
                <Input id="contact-name" name="name" required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "contact-name-error" : undefined} placeholder={t("marketing.namePlaceholder")} className="contact-field" onInput={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <RequiredLabel htmlFor="contact-email">{t("auth.email")}</RequiredLabel>
                  <FieldHint id="contact-email-error" message={fieldErrors.email} />
                </div>
                <Input id="contact-email" name="email" type="email" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "contact-email-error" : undefined} placeholder={t("marketing.emailPlaceholder")} className="contact-field" onInput={() => setFieldErrors((current) => ({ ...current, email: undefined }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <RequiredLabel htmlFor="contact-message">{t("marketing.whatBuild")}</RequiredLabel>
                <FieldHint id="contact-message-error" message={fieldErrors.message} />
              </div>
              <Textarea
                id="contact-message"
                name="message"
                required
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={fieldErrors.message ? "contact-message-error" : undefined}
                rows={5}
                placeholder={t("marketing.buildPlaceholder")}
                className="contact-field max-h-56 resize-y overflow-y-auto"
                onInput={() => setFieldErrors((current) => ({ ...current, message: undefined }))}
              />
            </div>
            <Button type="submit" disabled={pending} className="mt-2 self-start">
              {pending ? t("common.sending") : t("marketing.sendInquiry")}
            </Button>
        </form>
      </div>
      <Dialog open={submitted} onOpenChange={setSubmitted}>
        <DialogContent className="custom-build-thanks-modal !rounded-2xl !border-0 !ring-0 p-6 sm:max-w-md sm:p-7">
          <DialogHeader className="gap-2">
            <DialogTitle>{t("marketing.thanksInquiry")}</DialogTitle>
            <DialogDescription>{t("marketing.thanksInquiryIntro")}</DialogDescription>
          </DialogHeader>
          <Button variant="outline" className="mt-2" onClick={() => setSubmitted(false)}>
            {t("common.close")}
          </Button>
        </DialogContent>
      </Dialog>
    </section>
  );
}
