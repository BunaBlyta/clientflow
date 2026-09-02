"use client";

import { useCallback, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";
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
import { FieldHint } from "@/components/dashboard/field-hint";
import { DatePicker } from "@/components/dashboard/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchJson } from "@/lib/fetch-json";
import type { Invoice, InvoiceKind, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

const KIND_LABEL_KEY: Record<InvoiceKind, string> = {
  DEPOSIT: "invoices.kindDeposit",
  FINAL: "invoices.kindFinal",
  EXTRA: "invoices.kindExtra",
  CUSTOM: "invoices.kindCustom",
};
const CURRENCY_OPTIONS = ["usd", "eur", "gbp", "chf"] as const;

type InvoiceField = "project" | "amount";

export function CreateInvoiceDialog({
  projectId,
  currency = "usd",
  onCreated,
}: {
  projectId?: string;
  currency?: string;
  onCreated?: (invoice: Invoice) => void;
}) {
  const { t } = useLocale();
  const [projects, setProjects] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? "");
  const [kind, setKind] = useState<InvoiceKind>("EXTRA");
  const [selectedCurrency, setSelectedCurrency] = useState(() => currency.toLowerCase());
  const [dueDate, setDueDate] = useState("");
  const [pending, setPending] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<InvoiceField, string>>>({});

  const loadProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    setError(null);
    try {
      setProjects(await fetchJson<Project[]>("/api/projects", "We couldn't load the projects."));
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the projects.");
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen && !projectId) void loadProjects();
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    const form = new FormData(formElement);
    const amount = Number(form.get("amount"));
    const targetProjectId = projectId ?? selectedProjectId;
    const nextFieldErrors: Partial<Record<InvoiceField, string>> = {};

    if (!targetProjectId) {
      nextFieldErrors.project = t("common.required");
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      nextFieldErrors.amount = t("invoices.invalidAmount");
    }
    if (Object.keys(nextFieldErrors).length > 0) {
      setError(null);
      setFieldErrors(nextFieldErrors);
      return;
    }

    setFieldErrors({});
    setPending(true);
    setError(null);
    try {
      const invoice = await fetchJson<Invoice>("/api/invoices", "We couldn't create this invoice.", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: targetProjectId,
          type: kind,
          amount,
          currency: selectedCurrency,
          dueDate: String(form.get("dueDate") ?? "") || undefined,
          description: String(form.get("label") || t(KIND_LABEL_KEY[kind])),
        }),
      });
      onCreated?.(invoice);
      formElement.reset();
      setDueDate("");
      setFieldErrors({});
      setOpen(false);
      toast.success(t("invoices.created"), { description: t("invoices.createdDescription") });
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't create this invoice.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button size="sm" />}>
        <Plus />
        {t("invoices.newInvoice")}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.newInvoice")}</DialogTitle>
          <DialogDescription>{t("invoices.newInvoiceIntro")}</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!projectId && (
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="project">{t("projects.project")}</Label>
                <FieldHint id="project-error" message={fieldErrors.project} />
              </div>
              <Select value={selectedProjectId} onValueChange={(v) => { if (v) { setSelectedProjectId(v); setFieldErrors((current) => ({ ...current, project: undefined })); } }}>
                <SelectTrigger id="project" className="w-full" aria-invalid={Boolean(fieldErrors.project)} aria-describedby={fieldErrors.project ? "project-error" : undefined}>
                  <SelectValue placeholder={t("invoices.selectProject")} />
                </SelectTrigger>
                <SelectContent>
                    {isLoadingProjects ? (
                      <SelectItem value="loading" disabled>{t("projects.loading")}</SelectItem>
                    ) : projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="kind">{t("invoices.type")}</Label>
            <Select value={kind} onValueChange={(v) => v && setKind(v as InvoiceKind)}>
              <SelectTrigger id="kind" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL_KEY) as InvoiceKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {t(KIND_LABEL_KEY[k])}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">{t("invoices.label")}</Label>
            <Input id="label" name="label" placeholder={t(KIND_LABEL_KEY[kind])} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="amount">{t("invoices.amountUsd")}</Label>
                <FieldHint id="amount-error" message={fieldErrors.amount} />
              </div>
              <Input id="amount" name="amount" type="number" min="0" step="1" required aria-invalid={Boolean(fieldErrors.amount)} aria-describedby={fieldErrors.amount ? "amount-error" : undefined} onInput={() => setFieldErrors((current) => ({ ...current, amount: undefined }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="currency">{t("settings.currency")}</Label>
              <Select value={selectedCurrency} onValueChange={(value) => value && setSelectedCurrency(value)}>
                <SelectTrigger id="currency" className="w-full"><span>{selectedCurrency.toUpperCase()}</span></SelectTrigger>
                <SelectContent>
                  {CURRENCY_OPTIONS.map((option) => <SelectItem key={option} value={option}>{option.toUpperCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex h-5 items-center justify-between gap-2">
                <Label htmlFor="dueDate">{t("invoices.due")}</Label>
              </div>
              <DatePicker
                id="dueDate"
                name="dueDate"
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
          <DialogFooter className="w-full flex-row items-center gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)} disabled={pending}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={pending || isLoadingProjects}>
              {pending ? t("invoices.creating") : t("invoices.createInvoice")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
