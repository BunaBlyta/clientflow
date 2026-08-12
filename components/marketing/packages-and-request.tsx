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
import type { ManagedPackage } from "@/lib/types";

const mostPopularSlug = "full-website";
const customPackageSlug = "web-app-build";

function isCustomPackage(pkg: ManagedPackage) {
  return pkg.slug === customPackageSlug;
}

export function PackagesAndRequest() {
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
          "We couldn't load the packages.",
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
          setPackagesError(
            caughtError instanceof Error ? caughtError.message : "We couldn't load the packages.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setIsLoadingPackages(false);
      }
    });

    return () => controller.abort();
  }, []);

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
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">Packages</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Two fixed-price packages you can request directly, and a custom build we scope together.
          </p>
        </div>

        {isLoadingPackages ? (
          <p className="mt-10 text-[13px] text-muted-foreground">Loading packages…</p>
        ) : packagesError ? (
          <p role="alert" className="mt-10 text-[13px] text-status-danger">
            {packagesError}
          </p>
        ) : packages.length === 0 ? (
          <p className="mt-10 text-[13px] text-muted-foreground">No packages are available right now.</p>
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
                      Most popular
                    </span>
                  )}
                  <h3 className="text-[16px] font-semibold">{pkg.name}</h3>
                  <p className="mt-1 text-[28px] font-semibold tracking-tight">
                    {isCustomPackage(pkg) ? "Custom" : formatMajorCurrency(pkg.price, pkg.currency)}
                  </p>
                  <p className="mt-2 text-[13px] text-muted-foreground">{pkg.description}</p>
                  <ul className="mt-5 flex flex-1 flex-col gap-2.5">
                    <li className="flex items-start gap-2 text-[13px]">
                      <Check className="mt-0.5 size-3.5 shrink-0 text-brand-accent" />
                      <span>
                        {pkg.estimatedDuration
                          ? `Estimated delivery: ${pkg.estimatedDuration}`
                          : "Timeline set after scoping"}
                      </span>
                    </li>
                  </ul>
                  {isCustomPackage(pkg) ? (
                    <Button className="mt-6" variant="outline" render={<a href="#contact" />}>
                      Talk to us
                    </Button>
                  ) : (
                    <Button
                      className="mt-6"
                      variant={isPopular ? "default" : "outline"}
                      onClick={() => handleChoose(pkg.id)}
                    >
                      Request this package
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
          <h2 className="text-xl font-semibold tracking-tight sm:text-[22px]">Request a package</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Tell us a bit about your project. We&apos;ll review your request and follow up by email —
            nothing is charged until you approve and pay a deposit.
          </p>

          {submitted ? (
            <div className="mt-8 rounded-lg border border-border bg-background p-6">
              <p className="text-[14px] font-medium">Request received.</p>
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
                <Label htmlFor="package">Package</Label>
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
                  <Label htmlFor="name">Your name</Label>
                  <Input id="name" name="name" required placeholder="Ava Marlowe" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="companyName">Company</Label>
                  <Input id="companyName" name="companyName" placeholder="Marlowe & Finch" />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required placeholder="you@company.com" />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="message">What are you looking to build? (optional)</Label>
                <Textarea id="message" name="message" rows={4} placeholder="A landing page for a product launch in September..." />
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
                {pending ? "Submitting…" : "Submit request"}
              </Button>
            </form>
          )}
        </div>
        </section>
      )}
    </>
  );
}
