"use client";

import { useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldHint } from "@/components/dashboard/field-hint";
import type { ManagedPackage } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

type PackageField = "name" | "slug" | "price" | "currency" | "description" | "sortOrder";

export function CreatePackageDialog({
  onCreated,
  inline = false,
  onCancel,
}: {
  onCreated: (pkg: ManagedPackage) => void;
  inline?: boolean;
  onCancel?: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currency, setCurrency] = useState("usd");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PackageField, string>>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const price = Number(form.get("price"));
    const currency = String(form.get("currency") ?? "").trim();
    const sortOrder = Number(form.get("sortOrder"));
    const nextFieldErrors: Partial<Record<PackageField, string>> = {};

    if (!name) nextFieldErrors.name = t("common.required");
    if (!slug) nextFieldErrors.slug = t("common.required");
    else if (!/^[a-z0-9-]+$/.test(slug)) nextFieldErrors.slug = "Invalid slug.";
    if (!Number.isFinite(price) || price <= 0) nextFieldErrors.price = "Positive value required.";
    if (!currency) nextFieldErrors.currency = t("common.required");
    if (!description) nextFieldErrors.description = t("common.required");
    if (!Number.isInteger(sortOrder) || sortOrder < 0) nextFieldErrors.sortOrder = "Whole number required.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/packages", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          price,
          currency: currency.toLowerCase(),
          estimatedDuration: String(form.get("estimatedDuration") ?? "").trim() || undefined,
          sortOrder,
        }),
      });
      const result = (await response.json().catch(() => null)) as ManagedPackage | { error?: string } | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't create this package.",
        );
      }
      if (!result || !("id" in result)) throw new Error("The server returned an unexpected package response.");
      onCreated(result);
      formElement.reset();
      setCurrency("usd");
      setFieldErrors({});
      setOpen(false);
      onCancel?.();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't create this package.");
    } finally {
      setPending(false);
    }
  }

  function handleCancel() {
    setOpen(false);
    setError(null);
    onCancel?.();
  }

  const formContent = (
        <form
          noValidate
          onSubmit={handleSubmit}
          className={`flex min-h-0 flex-1 flex-col rounded-lg ${inline ? "p-0" : "p-4"}`}
        >
          <div className="flex min-h-0 flex-1 flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor="package-name">{t("settings.name")}</Label>
              <FieldHint id="package-name-error" message={fieldErrors.name} />
            </div>
            <Input id="package-name" name="name" required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? "package-name-error" : undefined} placeholder="Full Website" onInput={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor="package-slug">{t("settings.slug")}</Label>
              <FieldHint id="package-slug-error" message={fieldErrors.slug} />
            </div>
            <Input id="package-slug" name="slug" required pattern="[a-z0-9-]+" aria-invalid={Boolean(fieldErrors.slug)} aria-describedby={fieldErrors.slug ? "package-slug-error" : undefined} placeholder="full-website" onInput={() => setFieldErrors((current) => ({ ...current, slug: undefined }))} />
          </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="package-price">{t("settings.price")}</Label>
                <FieldHint id="package-price-error" message={fieldErrors.price} />
              </div>
              <Input id="package-price" name="price" type="number" min="0.01" step="0.01" required aria-invalid={Boolean(fieldErrors.price)} aria-describedby={fieldErrors.price ? "package-price-error" : undefined} onInput={() => setFieldErrors((current) => ({ ...current, price: undefined }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="package-currency">{t("settings.currency")}</Label>
                <FieldHint id="package-currency-error" message={fieldErrors.currency} />
              </div>
              <Select value={currency} onValueChange={(value) => { if (value) { setCurrency(value); setFieldErrors((current) => ({ ...current, currency: undefined })); } }}>
                <SelectTrigger id="package-currency" className="w-full" aria-invalid={Boolean(fieldErrors.currency)} aria-describedby={fieldErrors.currency ? "package-currency-error" : undefined}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD</SelectItem>
                  <SelectItem value="eur">EUR</SelectItem>
                  <SelectItem value="gbp">GBP</SelectItem>
                </SelectContent>
              </Select>
              <input type="hidden" name="currency" value={currency} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center">
                <Label htmlFor="package-duration">{t("settings.duration")}</Label>
              </div>
              <Input id="package-duration" name="estimatedDuration" placeholder="6–8 weeks" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor="package-description">{t("settings.description")}</Label>
              <FieldHint id="package-description-error" message={fieldErrors.description} />
            </div>
            <Textarea id="package-description" name="description" rows={2} required aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? "package-description-error" : undefined} onInput={() => setFieldErrors((current) => ({ ...current, description: undefined }))} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor="package-sort-order">{t("settings.sortOrder")}</Label>
              <FieldHint id="package-sort-order-error" message={fieldErrors.sortOrder} />
            </div>
            <Input id="package-sort-order" name="sortOrder" type="number" min="0" step="1" defaultValue="0" required aria-invalid={Boolean(fieldErrors.sortOrder)} aria-describedby={fieldErrors.sortOrder ? "package-sort-order-error" : undefined} onInput={() => setFieldErrors((current) => ({ ...current, sortOrder: undefined }))} />
          </div>
          {error && (
            <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <DialogFooter className="relative top-2 mt-auto w-full flex-row items-center gap-2">
            <Button type="button" variant="outline" className="min-h-10 flex-1" onClick={handleCancel} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="min-h-10 flex-1" disabled={pending}>
              {pending ? t("settings.creating") : t("settings.createPackage")}
            </Button>
          </DialogFooter>
          </div>
        </form>
  );

  if (inline) {
    return (
      <div className="settings-package-edit-shell rounded-lg border border-border">
        <div className="flex h-full w-full flex-col rounded-lg bg-muted/30 px-4 pt-4 pb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium">{t("settings.newPackage")}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">{t("settings.newPackageIntro")}</p>
            </div>
          </div>
          {formContent}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        {t("settings.newPackage")}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("settings.newPackage")}</DialogTitle>
          <DialogDescription>{t("settings.newPackageIntro")}</DialogDescription>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
