"use client";

import type { ReactElement } from "react";
import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLocale } from "@/lib/i18n";

type CustomBuildDialogProps = {
  trigger: ReactElement;
};
type CustomLeadField = "name" | "email" | "message";

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

export function CustomBuildDialog({ trigger }: CustomBuildDialogProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CustomLeadField, string>>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const nextFieldErrors: Partial<Record<CustomLeadField, string>> = {};

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

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen) {
      setError(null);
      setFieldErrors({});
      setSubmitted(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent id="custom-build-form" className="marketing-modal max-h-[calc(100vh-2rem)] overflow-y-auto !rounded-2xl !border-0 !ring-0 p-6 sm:max-w-lg sm:p-7">
        <DialogHeader className="gap-2">
          <DialogTitle>{t("marketing.customBuildTitle")}</DialogTitle>
          <DialogDescription>{t("marketing.customBuildIntro")}</DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="text-[14px] font-medium">{t("marketing.thanksInquiry")}</p>
            <p className="mt-1 text-[13px] text-muted-foreground">{t("marketing.thanksInquiryIntro")}</p>
            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
              {t("marketing.sendAnotherInquiry")}
            </Button>
          </div>
        ) : (
          <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <RequiredLabel htmlFor="custom-contact-name">{t("marketing.yourName")}</RequiredLabel>
                  <FieldHint id="custom-name-error" message={fieldErrors.name} />
                </div>
                <Input id="custom-contact-name" name="name" required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "custom-name-error" : undefined} placeholder={t("marketing.namePlaceholder")} className="contact-field" onInput={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <RequiredLabel htmlFor="custom-contact-email">{t("auth.email")}</RequiredLabel>
                  <FieldHint id="custom-email-error" message={fieldErrors.email} />
                </div>
                <Input id="custom-contact-email" name="email" type="email" required aria-invalid={Boolean(fieldErrors.email)} aria-describedby={fieldErrors.email ? "custom-email-error" : undefined} placeholder={t("marketing.emailPlaceholder")} className="contact-field" onInput={() => setFieldErrors((current) => ({ ...current, email: undefined }))} />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <RequiredLabel htmlFor="custom-contact-message">{t("marketing.whatBuild")}</RequiredLabel>
                <FieldHint id="custom-message-error" message={fieldErrors.message} />
              </div>
              <Textarea
                id="custom-contact-message"
                name="message"
                required
                aria-invalid={Boolean(fieldErrors.message)}
                aria-describedby={fieldErrors.message ? "custom-message-error" : undefined}
                rows={5}
                placeholder={t("marketing.buildPlaceholder")}
                className="contact-field max-h-56 resize-y overflow-y-auto"
                onInput={() => setFieldErrors((current) => ({ ...current, message: undefined }))}
              />
            </div>
            <Button type="submit" disabled={pending} className="mt-2 w-full">
              {pending ? t("common.sending") : t("marketing.sendInquiry")}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
