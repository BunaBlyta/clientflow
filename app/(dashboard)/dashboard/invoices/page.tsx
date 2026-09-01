"use client";

import { useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/format";
import { INVOICE_STATUS_TONE, invoiceDisplayLabelKey, invoiceDisplayTone } from "@/lib/status";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { InfiniteTableLoader, useInfiniteTable } from "@/components/dashboard/infinite-table-loader";
import { useStableTableColumns } from "@/components/dashboard/use-stable-table-columns";
import { SortableTableHeader } from "@/components/dashboard/sortable-table-header";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { Client, Invoice, InvoiceStatus, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import { fetchJson } from "@/lib/fetch-json";
import { upsertById } from "@/lib/upsert-by-id";
import type { PaginatedResponse } from "@/lib/pagination";

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
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [areLookupsLoading, setAreLookupsLoading] = useState(true);
  const [lookupsError, setLookupsError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL" | "OVERDUE">("ALL");
  const [timeFilter, setTimeFilter] = useState("ALL");
  const [sort, setSort] = useState<{ key: "createdAt" | "amount" | "dueDate"; direction: "asc" | "desc" }>({ key: "createdAt", direction: "desc" });

  const loadLookups = useCallback(async (signal?: AbortSignal) => {
    setAreLookupsLoading(true);
    setLookupsError(null);

    try {
      const [projectData, clientData] = await Promise.all([
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
        fetchJson<Client[]>("/api/clients", "We couldn't load the clients.", signal),
      ]);
      if (!Array.isArray(projectData) || !Array.isArray(clientData)) {
        throw new Error("The server returned an unexpected invoice response.");
      }

      if (!signal?.aborted) {
        setProjects(projectData);
        setClients(clientData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setLookupsError(caughtError instanceof Error ? caughtError.message : "We couldn't load invoice details.");
      }
    } finally {
      if (!signal?.aborted) setAreLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadLookups(controller.signal));
    return () => controller.abort();
  }, [loadLookups]);

  const loadInvoicePage = useCallback((page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
    if (statusFilter !== "ALL") query.set("status", statusFilter);
    if (timeFilter !== "ALL") query.set("time", timeFilter);
    query.set("sort", sort.key); query.set("direction", sort.direction);
    return fetchJson<PaginatedResponse<ApiInvoice>>(
      `/api/invoices?${query.toString()}`,
      "We couldn't load the invoices.",
      signal,
    );
  }, [deferredSearch, sort, statusFilter, timeFilter]);
  const invoiceTable = useInfiniteTable(loadInvoicePage);
  const invoices = invoiceTable.items;
  const setInvoices = invoiceTable.setItems;
  const isLoading = invoiceTable.isInitialLoading || areLookupsLoading;
  const error = invoiceTable.error ?? lookupsError;
  const tableRef = useStableTableColumns(!isLoading && !error);
  const invoiceMatchesFilters = useCallback((invoice: ApiInvoice) => {
    const matchesStatus = statusFilter === "ALL"
      || (statusFilter === "OVERDUE"
        ? invoiceDisplayLabelKey(invoice) === "status.invoice.OVERDUE"
        : invoice.status === statusFilter);
    if (!matchesStatus) return false;
    if (timeFilter !== "ALL") {
      const days = Number(timeFilter);
      if (Number.isFinite(days) && new Date(invoice.createdAt).getTime() < Date.now() - days * 86400000) return false;
    }

    const projectName = projects.find((project) => project.id === invoice.projectId)?.name ?? "";
    const clientName = clients.find((client) => client.id === invoice.clientId)?.companyName ?? "";
    return `${invoice.label} ${projectName} ${clientName}`
      .toLowerCase()
      .includes(deferredSearch.trim().toLowerCase());
  }, [clients, deferredSearch, projects, statusFilter, timeFilter]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity === "invoice") {
        void fetchJson<ApiInvoice>(
          `/api/invoices/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this invoice.",
        )
          .then((updatedInvoice) => setInvoices((currentInvoices) => {
            if (!invoiceMatchesFilters(updatedInvoice)) {
              return currentInvoices.filter((invoice) => invoice.id !== updatedInvoice.id);
            }
            return upsertById(currentInvoices, updatedInvoice)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }))
          .catch(() => undefined);
      } else if (detail?.entity === "project") {
        void fetchJson<Project>(
          `/api/projects/${encodeURIComponent(detail.id)}`,
          "We couldn't refresh this project.",
        )
          .then((updatedProject) =>
            setProjects((currentProjects) => upsertById(currentProjects, updatedProject)),
          )
          .catch(() => undefined);
      }
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [invoiceMatchesFilters, setInvoices]);

  const projectNames = useMemo(
    () => new Map(projects.map((project) => [project.id, project])),
    [projects],
  );
  const clientNames = useMemo(
    () => new Map(clients.map((client) => [client.id, client.companyName])),
    [clients],
  );

  const handleInvoiceUpdated = useCallback((updatedInvoice: Invoice) => {
    setInvoices((currentInvoices) => {
      const currentInvoice = currentInvoices.find((invoice) => invoice.id === updatedInvoice.id);
      const apiUpdatedInvoice = updatedInvoice as ApiInvoice;
      const mergedInvoice = currentInvoice
        ? { ...currentInvoice, ...updatedInvoice }
        : typeof apiUpdatedInvoice.clientId === "string"
          ? apiUpdatedInvoice
          : null;
      if (!mergedInvoice) return currentInvoices;
      if (!invoiceMatchesFilters(mergedInvoice)) {
        return currentInvoices.filter((invoice) => invoice.id !== updatedInvoice.id);
      }
      return upsertById(currentInvoices, mergedInvoice);
    });
  }, [invoiceMatchesFilters, setInvoices]);

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
          <Button className="mt-4" variant="outline" size="sm" onClick={() => {
            invoiceTable.reload();
            if (lookupsError) void loadLookups();
          }}>
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
            <span className={statusFilter === "ALL" || statusFilter === "OVERDUE" ? "text-foreground" : INVOICE_STATUS_TONE[statusFilter]}>
              {statusFilter === "ALL"
                ? t("status.filter.ALL")
                : statusFilter === "OVERDUE"
                  ? t("status.filter.OVERDUE")
                  : t(`status.invoice.${statusFilter}`)}
            </span>
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((filter) => (
              <SelectItem key={filter.value} value={filter.value}>
                <span className={filter.value === "ALL" || filter.value === "OVERDUE" ? "text-foreground" : INVOICE_STATUS_TONE[filter.value]}>
                  {filter.value === "ALL" || filter.value === "OVERDUE" ? t(`status.filter.${filter.value}`) : t(`status.invoice.${filter.value}`)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={timeFilter} onValueChange={(value) => value && setTimeFilter(value)}>
          <SelectTrigger className="w-36"><span>{timeFilter === "ALL" ? "All time" : `Last ${timeFilter} days`}</span></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All time</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </TableToolbar>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table ref={tableRef} className="w-full text-[13px]" style={{ overflowAnchor: "none" }}>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="py-3 pr-2 pl-5 font-normal">{t("invoices.invoice")}</th>
              <th className="py-3 pr-5 pl-2 font-normal">{t("invoices.project")}</th>
              <th className="px-5 py-3 font-normal">{t("clients.company")}</th>
              <SortableTableHeader label={t("common.amount")} active={sort.key === "amount"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "amount", direction: current.key === "amount" && current.direction === "asc" ? "desc" : "asc" }))} className="py-3 pr-0 pl-5 text-right" />
              <th className="py-3 pr-5 pl-24 font-normal">{t("common.status")}</th>
              <th className="px-5 py-3 font-normal">{t("invoices.sent")}</th>
              <SortableTableHeader label={t("invoices.due")} active={sort.key === "dueDate"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "dueDate", direction: current.key === "dueDate" && current.direction === "asc" ? "desc" : "asc" }))} className="px-5 py-3 text-right" />
              <th className="px-3 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => {
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
            {invoices.length === 0 && !deferredSearch.trim() && statusFilter === "ALL" && timeFilter === "ALL" && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center">
                  <p className="text-[13px] font-medium">{t("invoices.noInvoices")}</p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {t("invoices.createdIntro")}
                  </p>
                </td>
              </tr>
            )}
            {invoices.length === 0 && (deferredSearch.trim() || statusFilter !== "ALL" || timeFilter !== "ALL") && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                  {t("invoices.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <InfiniteTableLoader
        hasMore={invoiceTable.hasMore}
        isLoading={invoiceTable.isLoadingMore}
        error={invoiceTable.loadMoreError}
        onLoadMore={invoiceTable.loadMore}
      />
    </div>
  );
}
