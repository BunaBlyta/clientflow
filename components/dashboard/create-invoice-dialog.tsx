"use client";

import { useCallback, useState } from "react";
import { Plus } from "lucide-react";
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

const KIND_LABEL: Record<InvoiceKind, string> = {
  DEPOSIT: "Deposit",
  FINAL: "Final payment",
  EXTRA: "Extra charge",
  CUSTOM: "Custom",
};

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
  const [pending, setPending] = useState(false);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    if (!targetProjectId) {
      setError("Select a project before creating the invoice.");
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Enter a positive invoice amount.");
      return;
    }

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
          currency: currency.toLowerCase(),
          dueDate: String(form.get("dueDate") ?? "") || undefined,
          description: String(form.get("label") || KIND_LABEL[kind]),
        }),
      });
      onCreated?.(invoice);
      formElement.reset();
      setOpen(false);
      toast.success("Invoice created", { description: "The invoice is ready for the client." });
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("invoices.newInvoice")}</DialogTitle>
          <DialogDescription>{t("invoices.newInvoiceIntro")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!projectId && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="project">{t("projects.project")}</Label>
              <Select value={selectedProjectId} onValueChange={(v) => v && setSelectedProjectId(v)}>
                <SelectTrigger id="project" className="w-full">
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
                {(Object.keys(KIND_LABEL) as InvoiceKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="label">{t("invoices.label")}</Label>
            <Input id="label" name="label" placeholder={KIND_LABEL[kind]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">{t("invoices.amountUsd")}</Label>
              <Input id="amount" name="amount" type="number" min="0" step="1" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="dueDate">{t("invoices.due")}</Label>
              <Input id="dueDate" name="dueDate" type="date" />
            </div>
          </div>
          {error && (
            <p role="alert" className="border border-status-danger/30 bg-status-danger/5 px-3 py-2.5 text-[13px] text-status-danger">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending || isLoadingProjects}>
              {pending ? t("invoices.creating") : t("invoices.createInvoice")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
