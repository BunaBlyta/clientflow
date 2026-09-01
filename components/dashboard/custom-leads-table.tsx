"use client";

import { useCallback, useDeferredValue, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { ConvertCustomLeadDialog } from "@/components/dashboard/convert-custom-lead-dialog";
import { InfiniteTableLoader, useInfiniteTable } from "@/components/dashboard/infinite-table-loader";
import { useStableTableColumns } from "@/components/dashboard/use-stable-table-columns";
import { Button } from "@/components/ui/button";
import type { CustomLead, CustomLeadDetail } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { upsertById } from "@/lib/upsert-by-id";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";
import type { PaginatedResponse } from "@/lib/pagination";

export function CustomLeadsTable({ search }: { search: string }) {
  const router = useRouter();
  const { t } = useLocale();
  const deferredSearch = useDeferredValue(search);

  const loadLeadPage = useCallback((page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
    return fetchJson<PaginatedResponse<CustomLead>>(
      `/api/contact-leads?${query.toString()}`,
      "We couldn't load custom inquiries.",
      signal,
    );
  }, [deferredSearch]);
  const leadTable = useInfiniteTable(loadLeadPage);
  const tableRef = useStableTableColumns(!leadTable.isInitialLoading && !leadTable.error);
  const leads = leadTable.items;
  const setLeads = leadTable.setItems;
  const leadMatchesSearch = useCallback((lead: CustomLead) => (
    `${lead.name} ${lead.email} ${lead.message}`
      .toLowerCase()
      .includes(deferredSearch.trim().toLowerCase())
  ), [deferredSearch]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity !== "lead") return;

      void fetchJson<CustomLeadDetail>(
        `/api/contact-leads/${encodeURIComponent(detail.id)}`,
        "We couldn't refresh this inquiry.",
      )
        .then((updatedLead) => {
          const row: CustomLead = {
            ...updatedLead,
            ...(updatedLead.client ? { clientId: updatedLead.client.id } : {}),
          };
          setLeads((currentLeads) => {
            if (!leadMatchesSearch(row)) {
              return currentLeads.filter((lead) => lead.id !== row.id);
            }
            return currentLeads.some((lead) => lead.id === row.id)
              ? upsertById(currentLeads, row)
              : [row, ...currentLeads];
          });
        })
        .catch(() => undefined);
    };

    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [leadMatchesSearch, setLeads]);

  if (leadTable.isInitialLoading) {
    return <div className="flex min-h-56 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-brand-accent" />{t("projects.inquiriesLoading")}</div></div>;
  }

  if (leadTable.error) {
    return <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">{t("dashboard.inquiriesLoadFailed")}</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{leadTable.error}</p><Button className="mt-4" variant="outline" size="sm" onClick={leadTable.reload}><RefreshCw />{t("common.tryAgain")}</Button></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border border-border">
        <table ref={tableRef} className="w-full text-[13px]" style={{ overflowAnchor: "none" }}>
          <colgroup>
            <col />
            <col />
            <col />
            <col />
          </colgroup>
          <thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="px-4 py-2.5 font-normal">{t("projects.prospect")}</th><th className="px-4 py-2.5 font-normal">{t("inquiries.brief")}</th><th className="px-4 py-2.5 font-normal">{t("inquiries.received")}</th><th className="px-4 py-2.5 text-right font-normal">{t("common.actions")}</th></tr></thead>
          <tbody>
            {leads.map((lead) => (
              <tr
                key={lead.id}
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
                role="link"
                tabIndex={0}
                aria-label={`Open inquiry from ${lead.name}`}
                onClick={(event) => {
                  if (!isTableRowInteractiveTarget(event.target)) {
                    router.push(`/dashboard/inquiries/${lead.id}`);
                  }
                }}
                onKeyDown={(event) => {
                  if ((event.key === "Enter" || event.key === " ") && !isTableRowInteractiveTarget(event.target)) {
                    event.preventDefault();
                    router.push(`/dashboard/inquiries/${lead.id}`);
                  }
                }}
              >
                <td className="px-4 py-3"><p className="font-medium">{lead.name}</p><p className="text-[12px] text-muted-foreground">{lead.email}</p></td>
                <td className="max-w-md px-4 py-3 text-muted-foreground"><p className="line-clamp-2">{lead.message}</p></td>
                <td className="px-4 py-3 text-muted-foreground">{formatDate(lead.createdAt)}</td>
                <td className="px-4 py-3 text-right">{lead.clientId ? <span className="text-[12px] text-status-success">{t("inquiries.converted")}</span> : <ConvertCustomLeadDialog lead={lead} onConverted={(updatedLead) => setLeads((currentLeads) => upsertById(currentLeads, updatedLead))} />}</td>
              </tr>
            ))}
            {leads.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">{t("projects.noInquiries")}</td></tr>}
          </tbody>
        </table>
      </div>
      <InfiniteTableLoader
        hasMore={leadTable.hasMore}
        isLoading={leadTable.isLoadingMore}
        error={leadTable.loadMoreError}
        onLoadMore={leadTable.loadMore}
      />
    </div>
  );
}
