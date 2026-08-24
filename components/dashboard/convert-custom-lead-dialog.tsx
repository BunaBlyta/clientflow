"use client";

import { useState } from "react";
import { AlertCircle, LoaderCircle, WandSparkles } from "lucide-react";
import { toast } from "sonner";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import type { CustomLead } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldHint } from "@/components/dashboard/field-hint";
import { DatePicker } from "@/components/dashboard/date-picker";
import { useLocale } from "@/lib/i18n";

type ConversionField = "projectName" | "description" | "amount";

export function ConvertCustomLeadDialog({
  lead,
  onConverted,
}: {
  lead: CustomLead;
  onConverted: () => void;
}) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [projectName, setProjectName] = useState(`Custom build — ${lead.name}`);
  const [description, setDescription] = useState(lead.message);
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<ConversionField, string>>>({});

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextFieldErrors: Partial<Record<ConversionField, string>> = {};
    if (!projectName.trim()) nextFieldErrors.projectName = t("common.required");
    if (!description.trim()) nextFieldErrors.description = t("common.required");
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) nextFieldErrors.amount = "Invalid amount.";

    if (Object.keys(nextFieldErrors).length > 0) {
      setError(null);
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setPending(true);
    setError(null);

    try {
      const result = await fetchJson<{ emailSent: boolean | null }>(
        `/api/contact-leads/${encodeURIComponent(lead.id)}/convert`,
        "We couldn't create the custom project.",
        undefined,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            projectName,
            description,
            amount,
            currency: "usd",
            dueDate: dueDate || undefined,
            sendInvoice: true,
          }),
        },
      );
      setOpen(false);
      setFieldErrors({});
      onConverted();
      toast.success("Custom project created", {
        description:
          result.emailSent === false
            ? "The project was created, but the invitation email failed. Resend it from Clients."
            : result.emailSent === true
              ? "The client was invited and the custom invoice was sent."
              : "The custom project and invoice were created for the existing client.",
      });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't create the custom project.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="crm-neutral-action rounded-full" />}>
        <WandSparkles />
        {t("inquiries.createProject")}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("inquiries.convertTitle")}</DialogTitle>
          <DialogDescription>
            Inquiry received {formatDate(lead.createdAt)}.
          </DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto pr-1">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor={`company-${lead.id}`}>{t("clients.company")}</Label>
              <Input id={`company-${lead.id}`} value={companyName} onChange={(event) => setCompanyName(event.target.value)} placeholder={t("clients.companyPlaceholder")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>{t("clients.contact")}</Label>
              <p className="crm-modal-contact-field flex h-8 items-center truncate px-3 text-[12px] text-muted-foreground">{lead.name} · {lead.email}</p>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor={`project-${lead.id}`}>{t("projects.projectName")}</Label>
              <FieldHint id={`project-error-${lead.id}`} message={fieldErrors.projectName} />
            </div>
            <Input id={`project-${lead.id}`} value={projectName} onChange={(event) => { setProjectName(event.target.value); setFieldErrors((current) => ({ ...current, projectName: undefined })); }} required aria-invalid={Boolean(fieldErrors.projectName)} aria-describedby={fieldErrors.projectName ? `project-error-${lead.id}` : undefined} />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex h-5 items-center justify-between gap-2">
              <Label htmlFor={`description-${lead.id}`}>{t("inquiries.brief")}</Label>
              <FieldHint id={`description-error-${lead.id}`} message={fieldErrors.description} />
            </div>
            <Textarea id={`description-${lead.id}`} value={description} onChange={(event) => { setDescription(event.target.value); setFieldErrors((current) => ({ ...current, description: undefined })); }} rows={4} required aria-invalid={Boolean(fieldErrors.description)} aria-describedby={fieldErrors.description ? `description-error-${lead.id}` : undefined} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor={`amount-${lead.id}`}>{t("invoices.amountUsd")}</Label>
                <FieldHint id={`amount-error-${lead.id}`} message={fieldErrors.amount} />
              </div>
              <Input id={`amount-${lead.id}`} value={amount} onChange={(event) => { setAmount(event.target.value); setFieldErrors((current) => ({ ...current, amount: undefined })); }} type="number" min="0.01" step="0.01" required aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? `amount-error-${lead.id}` : undefined} placeholder="15000" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor={`due-${lead.id}`}>{t("invoices.due")}</Label>
              </div>
              <DatePicker
                id={`due-${lead.id}`}
                value={dueDate}
                ariaLabel={t("invoices.due")}
                onChange={setDueDate}
                className="w-full"
              />
            </div>
          </div>
          {error && (
            <div role="alert" className="form-warning flex items-start gap-2 border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] leading-5 text-status-danger">
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}
          <DialogFooter className="mt-1 w-full flex-row items-center gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={pending} className="crm-neutral-action flex-1 rounded-full">
              {pending && <LoaderCircle className="animate-spin" />}
              {pending ? t("settings.creating") : t("inquiries.createProject")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
