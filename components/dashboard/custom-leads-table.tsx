"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { ConvertCustomLeadDialog } from "@/components/dashboard/convert-custom-lead-dialog";
import { Button } from "@/components/ui/button";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import type { CustomLead } from "@/lib/types";

export function CustomLeadsTable() {
  const router = useRouter();
  const [leads, setLeads] = useState<CustomLead[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJson<CustomLead[]>("/api/contact-leads", "We couldn't load custom inquiries.", signal);
      if (!Array.isArray(data)) throw new Error("The server returned an unexpected inquiry response.");
      if (!signal?.aborted) setLeads(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) setError(caughtError instanceof Error ? caughtError.message : "We couldn't load custom inquiries.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadLeads(controller.signal));
    return () => controller.abort();
  }, [loadLeads]);

  const filtered = useMemo(() => {
    const query = search.toLowerCase();
    return leads.filter((lead) => `${lead.name} ${lead.email} ${lead.message}`.toLowerCase().includes(query));
  }, [leads, search]);

  if (isLoading) {
    return <div className="flex min-h-56 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground"><LoaderCircle className="size-4 animate-spin text-brand-accent" />Loading inquiries…</div></div>;
  }

  if (error) {
    return <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">Inquiries couldn&apos;t load</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={() => void loadLeads()}><RefreshCw />Try again</Button></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder="Search custom inquiries..." />
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="px-4 py-2.5 font-normal">Prospect</th><th className="px-4 py-2.5 font-normal">Brief</th><th className="px-4 py-2.5 font-normal">Received</th><th className="px-4 py-2.5 text-right font-normal">Action</th></tr></thead>
          <tbody>
            {filtered.map((lead) => (
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
                <td className="px-4 py-3 text-right">{lead.clientId ? <span className="text-[12px] text-status-success">Converted</span> : <ConvertCustomLeadDialog lead={lead} onConverted={() => void loadLeads()} />}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No custom inquiries match your search.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
