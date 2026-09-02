"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
import { formatMajorCurrency } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import { packageDescription, packageDuration, packageName } from "@/lib/package-copy";
import type { ManagedPackage } from "@/lib/types";

const mostPopularSlug = "full-website";
const customPackageSlug = "web-app-build";
type RequestField = "name" | "email";

function isCustomPackage(pkg: ManagedPackage) {
  return pkg.slug === customPackageSlug;
}

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

export function PackagesAndRequest() {
  const { t, locale } = useLocale();
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const standardPackages = packages.filter((p) => !isCustomPackage(p));
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const selectedPackage = standardPackages.find((p) => p.id === selectedPackageId);
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RequestField, string>>>({});

  useEffect(() => {
    const controller = new AbortController();

    void Promise.resolve().then(async () => {
      try {
        const packageData = await fetchJson<ManagedPackage[]>(
          "/api/packages",
          t("dashboard.retryLoad"),
          controller.signal,
        );
        if (!Array.isArray(packageData)) {
          throw new Error(t("marketing.packagesLoadFailed"));
        }
        if (!controller.signal.aborted) {
          setPackages(packageData);
          setSelectedPackageId(
            packageData.find((p) => !isCustomPackage(p))?.id ?? packageData[0]?.id ?? "",
          );
        }
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        if (!controller.signal.aborted) {
          setPackagesError(caughtError instanceof Error ? caughtError.message : t("dashboard.retryLoad"));
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPackages(false);
      }
    });

    return () => controller.abort();
  }, [t]);

  function handleChoose(packageId: string) {
    setSelectedPackageId(packageId);
    setSubmitError(null);
    setFieldErrors({});
    setSubmitted(false);
    setRequestOpen(true);
  }

  function handleRequestOpenChange(nextOpen: boolean) {
    setRequestOpen(nextOpen);
    if (!nextOpen) {
      setSubmitError(null);
      setFieldErrors({});
      setSubmitted(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const nextFieldErrors: Partial<Record<RequestField, string>> = {};

    if (!name) nextFieldErrors.name = t("common.required");
    if (!email) {
      nextFieldErrors.email = t("common.required");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextFieldErrors.email = t("common.invalidEmail");
    }

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setSubmitError(null);
    setPending(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId,
          name,
          email,
          companyName: String(form.get("companyName") ?? "").trim() || undefined,
          message: String(form.get("message") ?? "").trim() || undefined,
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : t("marketing.requestFailed"),
        );
      }

      formElement.reset();
      setFieldErrors({});
      setSubmitted(true);
      toast.success(t("marketing.requestSubmitted"), {
        description: t("marketing.requestSubmittedIntro"),
      });
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : t("marketing.requestFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <section id="packages" className="packages-section relative isolate overflow-visible">
        <div className="hero-package-sides pointer-events-none absolute inset-x-0 top-[-50vh] bottom-0 z-0" />
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("nav.packages")}</h2>
            <p className="mt-2 text-[14px] text-muted-foreground">{t("marketing.packagesIntro")}</p>
          </div>

          {isLoadingPackages ? (
            <p className="mt-10 text-[13px] text-muted-foreground">{t("common.loading")}</p>
          ) : packagesError ? (
            <p role="alert" className="mt-10 text-[13px] text-status-danger">{packagesError}</p>
          ) : packages.length === 0 ? (
            <p className="mt-10 text-[13px] text-muted-foreground">{t("marketing.noPackages")}</p>
          ) : (
            <div className="packages-shell package-housing mt-10 rounded-2xl border border-brand-sky/40 p-2 sm:p-3 dark:border-brand-accent/30">
              <div className="grid items-stretch gap-2 md:grid-cols-3">
                {packages.map((pkg) => {
                  const isPopular = pkg.slug === mostPopularSlug;
                  const isCustom = isCustomPackage(pkg);
                  return (
                    <div
                      key={pkg.id}
                      className={cn(
                        "package-card relative flex h-full min-h-[320px] flex-col rounded-lg border p-6",
                        isPopular && "package-card--popular",
                        isCustom ? "package-card--custom" : "package-card--standard",
                      )}
                    >
                      {isPopular && (
                        <span className="popular-stamp absolute top-4 right-4 flex size-16 items-center justify-center rounded-full border px-1 text-center text-[8px] leading-[1.05] font-semibold uppercase tracking-[0.1em]">
                          {t("marketing.mostPopular")}
                        </span>
                      )}
                      <h3 className="min-h-6 pr-20 text-[16px] font-semibold">{packageName(t, pkg, locale)}</h3>
                      <p className="package-price mt-1 min-h-9 text-[28px] font-semibold tracking-tight">
                        {isCustom ? t("marketing.custom") : formatMajorCurrency(pkg.price, pkg.currency)}
                      </p>
                      <p className="package-description mt-2 min-h-10 line-clamp-2 text-[13px] leading-5 text-muted-foreground">{packageDescription(t, pkg, locale)}</p>
                      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                        <li className="flex items-start gap-2 text-[13px]">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-sky dark:rounded-full dark:bg-brand-accent/25 dark:p-0.5 dark:text-foreground" />
                          <span>
                            {pkg.estimatedDuration
                              ? t("marketing.estimatedDelivery", { duration: packageDuration(t, pkg.estimatedDuration) })
                              : t("marketing.timelineScoped")}
                          </span>
                        </li>
                      </ul>
                      {isCustom ? (
                        <Button className="mt-6 w-full" render={<a href="#contact" />}>
                          {t("marketing.talkToUs")}
                        </Button>
                      ) : (
                        <Button
                          className={cn("mt-6 w-full", isPopular && "package-cta--popular")}
                          onClick={() => handleChoose(pkg.id)}
                        >
                          {t("marketing.requestPackage")}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {!isLoadingPackages && !packagesError && standardPackages.length > 0 && (
        <Dialog open={requestOpen} onOpenChange={handleRequestOpenChange}>
          <DialogContent id="request-form" className="marketing-modal request-modal max-h-[calc(100vh-2rem)] overflow-y-auto !rounded-2xl !border-0 !ring-0 p-6 sm:max-w-lg sm:p-7">
            <DialogHeader className="gap-2">
              <DialogTitle>{t("marketing.requestPackageTitle")}</DialogTitle>
              <DialogDescription>{t("marketing.requestPackageIntro")}</DialogDescription>
            </DialogHeader>

            {submitted ? (
              <div className="rounded-lg border border-border bg-muted/30 p-4">
                <p className="text-[14px] font-medium">{t("marketing.requestReceived")}</p>
                <p className="mt-1 text-[13px] text-muted-foreground">
                  {t("marketing.requestReceivedIntro")}
                </p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
                  {t("marketing.submitAnother")}
                </Button>
              </div>
            ) : (
              <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-5">
                {submitError && (
                  <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="package">{t("nav.packages")}</Label>
                  <Select value={selectedPackageId} onValueChange={(value) => value && setSelectedPackageId(value)}>
                    <SelectTrigger id="package" className="request-field request-modal-field w-full">
                      {/*
                        Rendered explicitly rather than via <SelectValue />,
                        which shows the raw item value — the package id — in the
                        trigger. Same pattern as the dashboard's filter selects.
                      */}
                      <span>
                        {selectedPackage
                          ? `${packageName(t, selectedPackage, locale)} — ${formatMajorCurrency(selectedPackage.price, selectedPackage.currency)}`
                          : ""}
                      </span>
                    </SelectTrigger>
                    <SelectContent
                      side="bottom"
                      align="start"
                      alignItemWithTrigger={false}
                      sideOffset={8}
                      className="request-package-content"
                    >
                      {standardPackages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {packageName(t, pkg, locale)} — {formatMajorCurrency(pkg.price, pkg.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex h-5 items-center justify-between gap-2">
                      <RequiredLabel htmlFor="name">{t("marketing.yourName")}</RequiredLabel>
                      <FieldHint id="request-name-error" message={fieldErrors.name} />
                    </div>
                    <Input
                      id="name"
                      name="name"
                      required
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={fieldErrors.name ? "request-name-error" : undefined}
                      placeholder={t("marketing.namePlaceholder")}
                      className="request-field request-modal-field"
                      onInput={() => setFieldErrors((current) => ({ ...current, name: undefined }))}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex h-5 items-center">
                      <Label htmlFor="companyName">{t("marketing.company")}</Label>
                    </div>
                    <Input id="companyName" name="companyName" placeholder={t("marketing.companyPlaceholder")} className="request-field request-modal-field" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex h-5 items-center justify-between gap-2">
                    <RequiredLabel htmlFor="email">{t("auth.email")}</RequiredLabel>
                    <FieldHint id="request-email-error" message={fieldErrors.email} />
                  </div>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    required
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "request-email-error" : undefined}
                    placeholder={t("marketing.emailPlaceholder")}
                    className="request-field request-modal-field"
                    onInput={() => setFieldErrors((current) => ({ ...current, email: undefined }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="message">{t("marketing.messageOptional")}</Label>
                  <Textarea id="message" name="message" rows={4} placeholder={t("marketing.messagePlaceholder")} className="request-field request-modal-field max-h-56 resize-none overflow-y-auto" />
                </div>
                <Button type="submit" disabled={pending} className="mt-2 w-full">
                  {pending ? t("marketing.submitting") : t("marketing.submitRequest")}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
