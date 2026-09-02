"use client";

import { useState } from "react";
import { AlertCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldHint } from "@/components/dashboard/field-hint";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import type { ManagedPackage } from "@/lib/types";
import { useLocale, LOCALE_LABELS } from "@/lib/i18n";
import { TRANSLATABLE_LOCALES, type PackageTranslations } from "@/lib/package-translations";

type PackageField = "name" | "price" | "currency" | "description";

export function EditPackageDialog({
  pkg,
  isEditing,
  onEdit,
  onCancel,
  onUpdated,
  onDeactivated,
}: {
  pkg: ManagedPackage;
  isEditing: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onUpdated: (pkg: ManagedPackage) => void;
  onDeactivated: () => void;
}) {
  const { t } = useLocale();
  const [confirmingDeactivation, setConfirmingDeactivation] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<PackageField, string>>>({});

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const price = Number(form.get("price"));
    const currency = String(form.get("currency") ?? "").trim();

    // Blank fields are simply omitted, which is how a locale is reset to English.
    const translations: PackageTranslations = {};
    for (const item of TRANSLATABLE_LOCALES) {
      const localeName = String(form.get(`translations.${item}.name`) ?? "").trim();
      const localeDescription = String(form.get(`translations.${item}.description`) ?? "").trim();
      if (localeName || localeDescription) {
        translations[item] = {
          ...(localeName ? { name: localeName } : {}),
          ...(localeDescription ? { description: localeDescription } : {}),
        };
      }
    }
    const nextFieldErrors: Partial<Record<PackageField, string>> = {};

    if (!name) nextFieldErrors.name = t("common.required");
    if (!Number.isFinite(price) || price <= 0) nextFieldErrors.price = "Positive value required.";
    if (!currency) nextFieldErrors.currency = t("common.required");
    if (!description) nextFieldErrors.description = t("common.required");

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/packages/${encodeURIComponent(pkg.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          price,
          currency: currency.toLowerCase(),
          estimatedDuration: String(form.get("estimatedDuration") || "").trim() || null,
          translations: Object.keys(translations).length > 0 ? translations : null,
        }),
      });
      const result = (await response.json().catch(() => null)) as ManagedPackage | { error?: string } | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't update this package.",
        );
      }
      if (!result || !("id" in result)) throw new Error("The server returned an unexpected package response.");
      onUpdated(result);
      setFieldErrors({});
      onCancel();
      toast.success(`${pkg.name} updated`, {
        description: "Changes apply to the public pricing page immediately.",
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't update this package.");
    } finally {
      setPending(false);
    }
  }

  async function handleDeactivate() {
    setError(null);

    try {
      const response = await fetch(`/api/packages/${encodeURIComponent(pkg.id)}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: false }),
      });
      const result = (await response.json().catch(() => null)) as ManagedPackage | { error?: string } | null;
      if (!response.ok) {
        throw new Error(
          result && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't delete this package.",
        );
      }
      if (!result || !("id" in result)) throw new Error("The server returned an unexpected package response.");
      onDeactivated();
      onCancel();
      toast.success(`${pkg.name} deleted`, {
        description: "It is no longer available for new requests. Existing projects and invoices are unchanged.",
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't delete this package.");
    }
  }

  return (
    <>
      {!isEditing ? (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil />
          Edit
        </Button>
      ) : (
        <div className="flex h-full w-full flex-col rounded-lg bg-muted/30 px-4 pt-4 pb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-[14px] font-medium">{t("settings.editPackage", { name: pkg.name })}</p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                Feeds both the public pricing page and internal project creation.
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => { onCancel(); setError(null); }}>
              {t("common.cancel")}
            </Button>
          </div>
          <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label className="pl-1" htmlFor={`edit-package-name-${pkg.id}`}>{t("settings.name")}</Label>
                <FieldHint id={`edit-package-name-error-${pkg.id}`} message={fieldErrors.name} />
              </div>
              <Input id={`edit-package-name-${pkg.id}`} name="name" defaultValue={pkg.name} required aria-invalid={Boolean(fieldErrors.name)} aria-describedby={fieldErrors.name ? `edit-package-name-error-${pkg.id}` : undefined} onInput={() => setFieldErrors((current) => ({ ...current, name: undefined }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <Label className="pl-1" htmlFor={`edit-package-price-${pkg.id}`}>{t("settings.priceCurrency", { currency: pkg.currency.toUpperCase() })}</Label>
                  <FieldHint id={`edit-package-price-error-${pkg.id}`} message={fieldErrors.price} />
                </div>
                <Input
                  id={`edit-package-price-${pkg.id}`}
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  defaultValue={pkg.price}
                  required
                  aria-invalid={Boolean(fieldErrors.price)}
                  aria-describedby={fieldErrors.price ? `edit-package-price-error-${pkg.id}` : undefined}
                  onInput={() => setFieldErrors((current) => ({ ...current, price: undefined }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <div className="flex h-5 items-center justify-between gap-2">
                  <Label className="pl-1" htmlFor={`edit-package-currency-${pkg.id}`}>{t("settings.currency")}</Label>
                  <FieldHint id={`edit-package-currency-error-${pkg.id}`} message={fieldErrors.currency} />
                </div>
                <Input
                  id={`edit-package-currency-${pkg.id}`}
                  name="currency"
                  defaultValue={pkg.currency}
                  maxLength={3}
                  required
                  aria-invalid={Boolean(fieldErrors.currency)}
                  aria-describedby={fieldErrors.currency ? `edit-package-currency-error-${pkg.id}` : undefined}
                  onInput={() => setFieldErrors((current) => ({ ...current, currency: undefined }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="pl-1" htmlFor={`edit-package-duration-${pkg.id}`}>{t("settings.duration")}</Label>
              <Input
                id={`edit-package-duration-${pkg.id}`}
                name="estimatedDuration"
                defaultValue={pkg.estimatedDuration ?? ""}
                placeholder="6–8 weeks"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label className="pl-1" htmlFor={`edit-package-description-${pkg.id}`}>{t("settings.description")}</Label>
                <FieldHint id={`edit-package-description-error-${pkg.id}`} message={fieldErrors.description} />
              </div>
              <Textarea id={`edit-package-description-${pkg.id}`} name="description" defaultValue={pkg.description} rows={2} className="px-3 py-3.5" style={{ paddingInline: 14, paddingBlock: 14 }} required aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? `edit-package-description-error-${pkg.id}` : undefined} onInput={() => setFieldErrors((current) => ({ ...current, description: undefined }))} />
            </div>
            <div className="flex flex-col gap-4 border-t border-border pt-4">
              <div className="flex flex-col gap-1">
                <p className="text-[13px] font-medium">{t("settings.translations")}</p>
                <p className="text-[12px] text-muted-foreground">{t("settings.translationsIntro")}</p>
              </div>
              {TRANSLATABLE_LOCALES.map((item) => (
                <div key={item} className="flex flex-col gap-1.5">
                  <Label className="pl-1 text-[12px] text-muted-foreground">{LOCALE_LABELS[item]}</Label>
                  <Input
                    id={`edit-package-${item}-name-${pkg.id}`}
                    name={`translations.${item}.name`}
                    defaultValue={pkg.translations?.[item]?.name ?? ""}
                    placeholder={pkg.name}
                    aria-label={`${LOCALE_LABELS[item]} — ${t("settings.packageName")}`}
                  />
                  <Textarea
                    id={`edit-package-${item}-description-${pkg.id}`}
                    name={`translations.${item}.description`}
                    defaultValue={pkg.translations?.[item]?.description ?? ""}
                    placeholder={pkg.description}
                    rows={2}
                    className="px-3 py-3.5"
                    style={{ paddingInline: 14, paddingBlock: 14 }}
                    aria-label={`${LOCALE_LABELS[item]} — ${t("settings.description")}`}
                  />
                </div>
              ))}
            </div>
            {error && (
              <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => setConfirmingDeactivation(true)}
                disabled={pending}
              >
                <Trash2 />
                {t("settings.deletePackage")}
              </Button>
              <Button type="submit" className="flex-1" disabled={pending}>{pending ? t("common.saving") : t("common.save")}</Button>
            </div>
          </form>
        </div>
      )}
      <ConfirmDialog
        open={confirmingDeactivation}
        onOpenChange={setConfirmingDeactivation}
        title={`Delete ${pkg.name}?`}
        description={t("settings.deactivateDescription")}
        confirmLabel={t("settings.deletePackage")}
        onConfirm={handleDeactivate}
      />
    </>
  );
}
