"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
import { formatMajorCurrency } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import type { ManagedPackage } from "@/lib/types";
import { CustomBuildDialog } from "@/components/marketing/custom-build-dialog";

const mostPopularSlug = "full-website";
const customPackageSlug = "web-app-build";

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

export function PackagesAndRequest() {
  const { t } = useLocale();
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const standardPackages = packages.filter((p) => !isCustomPackage(p));
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [requestOpen, setRequestOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
          throw new Error("We couldn't load the packages.");
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
    setSubmitted(false);
    setRequestOpen(true);
  }

  function handleRequestOpenChange(nextOpen: boolean) {
    setRequestOpen(nextOpen);
    if (!nextOpen) {
      setSubmitError(null);
      setSubmitted(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    setSubmitError(null);
    setPending(true);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageId: selectedPackageId,
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          companyName: String(form.get("companyName") ?? "").trim() || undefined,
          message: String(form.get("message") ?? "").trim() || undefined,
        }),
      });
      const result = (await response.json().catch(() => null)) as { error?: unknown } | null;

      if (!response.ok) {
        throw new Error(
          typeof result?.error === "string" ? result.error : "We couldn't submit your request.",
        );
      }

      formElement.reset();
      setSubmitted(true);
      toast.success("Request submitted", {
        description: "We'll review it and follow up by email shortly.",
      });
    } catch (caughtError) {
      setSubmitError(
        caughtError instanceof Error ? caughtError.message : "We couldn't submit your request.",
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
                        <span className="popular-stamp absolute top-4 right-4 flex min-h-10 items-center justify-center rounded-full border px-4 text-center text-[10px] leading-[1.1] font-semibold uppercase tracking-[0.12em]">
                          {t("marketing.mostPopular")}
                        </span>
                      )}
                      <h3 className="min-h-6 pr-20 text-[16px] font-semibold">{pkg.name}</h3>
                      <p className="package-price mt-1 min-h-9 text-[28px] font-semibold tracking-tight">
                        {isCustom ? t("marketing.custom") : formatMajorCurrency(pkg.price, pkg.currency)}
                      </p>
                      <p className="package-description mt-2 h-10 text-[13px] leading-5 text-muted-foreground">{pkg.description}</p>
                      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                        <li className="flex items-start gap-2 text-[13px]">
                          <Check className="mt-0.5 size-4 shrink-0 text-brand-sky dark:rounded-full dark:bg-brand-accent/25 dark:p-0.5 dark:text-foreground" />
                          <span>
                            {pkg.estimatedDuration
                              ? t("marketing.estimatedDelivery", { duration: pkg.estimatedDuration })
                              : t("marketing.timelineScoped")}
                          </span>
                        </li>
                      </ul>
                      {isCustom ? (
                        <CustomBuildDialog
                          trigger={
                            <Button className="mt-6 w-full">
                              {t("marketing.talkToUs")}
                            </Button>
                          }
                        />
                      ) : (
                        <Button className="mt-6 w-full" onClick={() => handleChoose(pkg.id)}>
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
          <DialogContent id="request-form" className="max-h-[calc(100vh-2rem)] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {submitError && (
                  <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span>{submitError}</span>
                  </div>
                )}
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="package">{t("nav.packages")}</Label>
                  <Select value={selectedPackageId} onValueChange={(value) => value && setSelectedPackageId(value)}>
                    <SelectTrigger id="package" className="request-field w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="bottom" align="start" sideOffset={8}>
                      {standardPackages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id}>
                          {pkg.name} — {formatMajorCurrency(pkg.price, pkg.currency)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <RequiredLabel htmlFor="name">{t("marketing.yourName")}</RequiredLabel>
                    <Input id="name" name="name" required placeholder={t("marketing.namePlaceholder")} className="request-field" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="companyName">{t("marketing.company")}</Label>
                    <Input id="companyName" name="companyName" placeholder={t("marketing.companyPlaceholder")} className="request-field" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <RequiredLabel htmlFor="email">{t("auth.email")}</RequiredLabel>
                  <Input id="email" name="email" type="email" required placeholder={t("marketing.emailPlaceholder")} className="request-field" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="message">{t("marketing.messageOptional")}</Label>
                  <Textarea id="message" name="message" rows={4} placeholder={t("marketing.messagePlaceholder")} className="request-field max-h-56 resize-y overflow-y-auto" />
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
