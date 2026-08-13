"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { fetchJson } from "@/lib/fetch-json";
import { formatMajorCurrency } from "@/lib/format";
import { useLocale } from "@/lib/i18n";
import type { ManagedPackage } from "@/lib/types";

const mostPopularSlug = "full-website";
const customPackageSlug = "web-app-build";

function isCustomPackage(pkg: ManagedPackage) {
  return pkg.slug === customPackageSlug;
}

export function PackagesAndRequest() {
  const { t } = useLocale();
  const [packages, setPackages] = useState<ManagedPackage[]>([]);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);
  const standardPackages = packages.filter((p) => !isCustomPackage(p));
  const [selectedPackageId, setSelectedPackageId] = useState("");
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
    document.getElementById("request-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      <section id="packages" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-xl">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("nav.packages")}</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t("marketing.packagesIntro")}
          </p>
        </div>

        {isLoadingPackages ? (
          <p className="mt-10 text-[13px] text-muted-foreground">{t("common.loading")}</p>
        ) : packagesError ? (
          <p role="alert" className="mt-10 text-[13px] text-status-danger">
            {packagesError}
          </p>
        ) : packages.length === 0 ? (
          <p className="mt-10 text-[13px] text-muted-foreground">{t("marketing.noPackages")}</p>
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {packages.map((pkg) => {
              const isPopular = pkg.slug === mostPopularSlug;
              return (
                <div
                  key={pkg.id}
                  className={cn(
                    "flex flex-col rounded-lg border border-border bg-background p-6",
                    isPopular && "border-2 border-brand-accent",
                  )}
                >
                  {isPopular && (
                    <span className="mb-3 w-fit rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-[12px] font-medium text-brand-accent">
                      {t("marketing.mostPopular")}
                    </span>
                  )}
                  <h3 className="text-[16px] font-semibold">{pkg.name}</h3>
                  <p className="mt-1 text-[28px] font-semibold tracking-tight">
                    {isCustomPackage(pkg) ? t("marketing.custom") : formatMajorCurrency(pkg.price, pkg.currency)}
                  </p>
                  <p className="mt-2 text-[13px] text-muted-foreground">{pkg.description}</p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    <li className="flex items-start gap-2 text-[13px]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand-accent" />
                      <span>
                        {pkg.estimatedDuration
                          ? t("marketing.estimatedDelivery", { duration: pkg.estimatedDuration })
                          : t("marketing.timelineScoped")}
                      </span>
                    </li>
                  </ul>
                  {isCustomPackage(pkg) ? (
                    <Button className="mt-6" variant="outline" render={<a href="#contact" />}>
                      {t("marketing.talkToUs")}
                    </Button>
                  ) : (
                    <Button
                      className="mt-6"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleChoose(pkg.id)}
                    >
                      {t("marketing.requestPackage")}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {!isLoadingPackages && !packagesError && standardPackages.length > 0 && (
        <section id="request-form" className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">{t("marketing.requestPackageTitle")}</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            {t("marketing.requestPackageIntro")}
          </p>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-border bg-background p-6">
            <p className="text-[14px] font-medium">{t("marketing.requestReceived")}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                We&apos;ll email you once it&apos;s been reviewed. You can submit another request anytime.
              </p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
                Submit another request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="package">{t("nav.packages")}</Label>
                <Select
                  value={selectedPackageId}
                  onValueChange={(value) => value && setSelectedPackageId(value)}
                >
                  <SelectTrigger id="package" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
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
                  <Label htmlFor="name">{t("marketing.yourName")}</Label>
                  <Input id="name" name="name" required placeholder={t("marketing.namePlaceholder")} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName">{t("marketing.company")}</Label>
                  <Input id="companyName" name="companyName" placeholder={t("marketing.companyPlaceholder")} />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">{t("auth.email")}</Label>
                <Input id="email" name="email" type="email" required placeholder={t("marketing.emailPlaceholder")} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">{t("marketing.messageOptional")}</Label>
                <Textarea id="message" name="message" rows={4} placeholder={t("marketing.messagePlaceholder")} />
              </div>
              {submitError && (
                <p
                  role="alert"
                  className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger"
                >
                  {submitError}
                </p>
              )}
              <Button type="submit" disabled={pending} className="mt-2">
                {pending ? t("marketing.submitting") : t("marketing.submitRequest")}
              </Button>
            </form>
          )}
        </div>
        </section>
      )}
    </>
  );
}
