"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceDisplayLabelKey, invoiceDisplayTone } from "@/lib/status";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Client, Invoice, InvoiceStatus, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";

type ApiInvoice = Invoice & { clientId: string };

const STATUS_FILTERS: { value: InvoiceStatus | "ALL" | "OVERDUE"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "VOIDED", label: "Voided" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function InvoicesPage() {
  const { t } = useLocale();
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL" | "OVERDUE">("ALL");

  const loadInvoices = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [invoicesResponse, projectsResponse, clientsResponse] = await Promise.all([
        fetch("/api/invoices", { credentials: "include", signal }),
        fetch("/api/projects", { credentials: "include", signal }),
        fetch("/api/clients", { credentials: "include", signal }),
      ]);

      const responses = [
        [invoicesResponse, "invoices"],
        [projectsResponse, "projects"],
        [clientsResponse, "clients"],
      ] as const;
      for (const [response, resource] of responses) {
        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(body?.error ?? `We couldn't load the ${resource}.`);
        }
      }

      const [invoiceData, projectData, clientData] = (await Promise.all([
        invoicesResponse.json(),
        projectsResponse.json(),
        clientsResponse.json(),
      ])) as [ApiInvoice[], Project[], Client[]];
      if (!Array.isArray(invoiceData) || !Array.isArray(projectData) || !Array.isArray(clientData)) {
        throw new Error("The server returned an unexpected invoice response.");
      }

      if (!signal?.aborted) {
        setInvoices(invoiceData);
        setProjects(projectData);
        setClients(clientData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the invoices.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadInvoices(controller.signal));
    return () => controller.abort();
  }, [loadInvoices]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity === "invoice" || detail?.entity === "project") void loadInvoices();
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [loadInvoices]);

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.companyName])),
    [clients],
  );

  const filtered = useMemo(() => {
    return invoices
      .filter((invoice) => {
        if (statusFilter === "ALL") return true;
        if (statusFilter === "OVERDUE") return invoiceDisplayLabelKey(invoice) === "status.invoice.OVERDUE";
        return invoice.status === statusFilter;
      })
      .filter((invoice) => {
        const project = projectNames.get(invoice.projectId);
        const haystack = `${invoice.label} ${project?.name ?? ""} ${
          clientNames.get(invoice.clientId) ?? ""
        }`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clientNames, invoices, projectNames, search, statusFilter]);

  const handleInvoiceUpdated = useCallback((updatedInvoice: Invoice) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? { ...invoice, ...updatedInvoice } : invoice,
      ),
    );
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex min-h-56 items-center justify-center border border-border">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-brand-accent" />
            {t("common.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
          <p className="text-[13px] font-medium text-status-danger">{t("dashboard.invoicesLoadFailed")}</p>
          <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadInvoices()}>
            <RefreshCw />
          {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder={t("invoices.search")}>
        <Select value={statusFilter} onValueChange={(value) => value && setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                {filter.value === "ALL" || filter.value === "OVERDUE" ? t(`status.filter.${filter.value}`) : t(`status.invoice.${filter.value}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableToolbar>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="py-3 pr-2 pl-5 font-normal">{t("invoices.invoice")}</th>
              <th className="py-3 pr-5 pl-2 font-normal">{t("invoices.project")}</th>
              <th className="px-5 py-3 font-normal">{t("clients.company")}</th>
              <th className="py-3 pr-0 pl-5 text-right font-normal">{t("common.amount")}</th>
              <th className="py-3 pr-5 pl-24 font-normal">{t("common.status")}</th>
              <th className="px-5 py-3 font-normal">{t("invoices.sent")}</th>
              <th className="px-5 py-3 text-right font-normal">{t("invoices.due")}</th>
              <th className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((invoice) => {
              const project = projectNames.get(invoice.projectId);
              return (
                <tr key={invoice.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-3.5 pr-2 pl-5">
                    <span className="font-medium">{invoice.label}</span>
                  </td>
                  <td className="py-3.5 pr-5 pl-2 text-muted-foreground">
                    {project ? (
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:text-brand-accent">
                        {project.name}
                      </Link>
                    ) : (
                      t("common.unknown")
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {clientNames.get(invoice.clientId) ?? t("common.unknown")}
                  </td>
                  <td className="py-3.5 pr-0 pl-5 text-right tabular-nums">{formatCurrency(invoice.amountCents)}</td>
                  <td className="py-3.5 pr-5 pl-24">
                    <span className={invoiceDisplayTone(invoice)}>{t(invoiceDisplayLabelKey(invoice))}</span>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}
                  </td>
                  <td className="px-5 py-3.5 text-right text-muted-foreground">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : "—"}
                  </td>
                  <td className="px-3 py-3.5 text-right">
                    <InvoiceRowActions
                      invoice={invoice}
                      onInvoiceUpdated={handleInvoiceUpdated}
                    />
                  </td>
                </tr>
              );
            })}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium">{t("invoices.noInvoices")}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {t("invoices.createdIntro")}
                  </p>
                </td>
              </tr>
            )}
            {invoices.length > 0 && filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {t("invoices.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
