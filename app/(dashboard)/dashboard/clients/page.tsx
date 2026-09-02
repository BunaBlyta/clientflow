"use client";

import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, MoreHorizontal, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { InfiniteTableLoader, useInfiniteTable } from "@/components/dashboard/infinite-table-loader";
import { useStableTableColumns } from "@/components/dashboard/use-stable-table-columns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { SortableTableHeader } from "@/components/dashboard/sortable-table-header";
import type { Client } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { EMPTY_TABLE_FILTERS, usePreferencesStore } from "@/lib/preferences-store";
import type { PaginatedResponse } from "@/lib/pagination";

export default function ClientsPage() {
  const { t, locale } = useLocale();
  const router = useRouter();
  const filters = usePreferencesStore((state) => state.tableFilters.clients) ?? EMPTY_TABLE_FILTERS;
  const setTableFilter = usePreferencesStore((state) => state.setTableFilter);
  const search = filters.search ?? "";
  const packageFilter = filters.package ?? "ALL";
  const setSearch = (value: string) => setTableFilter("clients", "search", value);
  const setPackageFilter = (value: string) => setTableFilter("clients", "package", value);
  const savedSort = usePreferencesStore((state) => state.tableSort.clients) as { key?: "companyName" | "createdAt"; direction?: "asc" | "desc" } | undefined;
  const setTableSort = usePreferencesStore((state) => state.setTableSort);
  const sort = useMemo(() => ({ key: savedSort?.key ?? "companyName", direction: savedSort?.direction ?? "asc" } as { key: "companyName" | "createdAt"; direction: "asc" | "desc" }), [savedSort?.direction, savedSort?.key]);
  const setSort = (updater: (current: typeof sort) => typeof sort) => setTableSort("clients", updater(sort));
  const deferredSearch = useDeferredValue(search);
  const [resendingClientId, setResendingClientId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<{ clientId: string; message: string } | null>(null);

  const loadClientPage = useCallback((page: number, signal?: AbortSignal) => {
    const query = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
    if (packageFilter !== "ALL") query.set("packageId", packageFilter);
    query.set("sort", sort.key); query.set("direction", sort.direction);
    return fetchJson<PaginatedResponse<Client>>(
      `/api/clients?${query.toString()}`,
      "We couldn't load the clients.",
      signal,
    );
  }, [deferredSearch, packageFilter, sort]);
  const clientTable = useInfiniteTable(loadClientPage);
  const clients = clientTable.items;
  const isLoading = clientTable.isInitialLoading;
  const error = clientTable.error;
  const tableRef = useStableTableColumns(!isLoading && !error);
  const packageOptions = useMemo(
    () => Array.from(new Map(clients.flatMap((client) => client.packageTypes ?? []).map((pkg) => [pkg.id, pkg.name])).entries()),
    [clients],
  );

  async function handleResendInvitation(client: Client) {
    setResendingClientId(client.id);
    setResendError(null);
    try {
      const result = await fetchJson<{ emailSent: boolean }>(
        `/api/clients/${encodeURIComponent(client.id)}/resend-invitation`,
        "We couldn't resend the invitation.",
        undefined,
        { method: "POST" },
      );
      if (!result.emailSent) throw new Error("The invitation email could not be sent. Try again.");
      toast.success("Invitation sent", { description: `A fresh sign-in code was sent to ${client.email}.` });
    } catch (caughtError) {
      setResendError({
        clientId: client.id,
        message: caughtError instanceof Error ? caughtError.message : "We couldn't resend the invitation.",
      });
    } finally {
      setResendingClientId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-56 items-center justify-center border border-border">
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
          <LoaderCircle className="size-4 animate-spin text-brand-accent" />
            {t("common.loading")}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
        <p className="text-[13px] font-medium text-status-danger">{t("dashboard.clientsLoadFailed")}</p>
        <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
        <Button className="mt-4" variant="outline" size="sm" onClick={() => {
          clientTable.reload();
        }}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder={t("clients.search")}>
        <Select value={packageFilter} onValueChange={(value) => value && setPackageFilter(value)}>
          <SelectTrigger className="w-44"><span>{packageFilter === "ALL" ? t("projects.allPackages") : packageOptions.find(([id]) => id === packageFilter)?.[1]}</span></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("projects.allPackages")}</SelectItem>
            {packageOptions.filter(([id]) => id).map(([id, name]) => <SelectItem key={id} value={id!}>{name}</SelectItem>)}
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
          </colgroup>
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <SortableTableHeader label={t("clients.company")} active={sort.key === "companyName"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "companyName", direction: current.key === "companyName" && current.direction === "asc" ? "desc" : "asc" }))} className="px-4 py-2.5" />
              <th className="px-4 py-2.5 font-normal">{t("clients.contact")}</th>
              <th className="px-4 py-2.5 font-normal">{t("clients.projects")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("clients.totalBilled")}</th>
              <SortableTableHeader label={t("clients.since")} active={sort.key === "createdAt"} direction={sort.direction} onClick={() => setSort((current) => ({ key: "createdAt", direction: current.key === "createdAt" && current.direction === "asc" ? "desc" : "asc" }))} className="px-4 py-2.5 text-right" />
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              return (
                <tr
                  key={client.id}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent"
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${client.companyName}`}
                  onClick={(event) => {
                    if (!isTableRowInteractiveTarget(event.target)) {
                      router.push(`/dashboard/clients/${client.id}`);
                    }
                  }}
                  onKeyDown={(event) => {
                    if ((event.key === "Enter" || event.key === " ") && !isTableRowInteractiveTarget(event.target)) {
                      event.preventDefault();
                      router.push(`/dashboard/clients/${client.id}`);
                    }
                  }}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-7">
                        <AvatarFallback className="text-[11px]">
                          {initials(client.companyName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{client.companyName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <p>{client.contactName}</p>
                    <p className="text-[12px]">{client.email}</p>
                    {resendError?.clientId === client.id && (
                      <p role="alert" className="mt-1 text-[11px] text-status-danger">{resendError.message}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client.projectCount ?? 0}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(client.totalBilledCents ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(client.createdAt, locale)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="crm-table-action-menu w-48">
                        <DropdownMenuItem
                          className="crm-table-action-item"
                          disabled={resendingClientId !== null}
                          onClick={() => void handleResendInvitation(client)}
                        >
                          {resendingClientId === client.id ? (
                            <LoaderCircle className="animate-spin" />
                          ) : null}
                          {resendingClientId === client.id ? t("common.sending") : t("clients.resendInvitation")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
            {clients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t("clients.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <InfiniteTableLoader
        hasMore={clientTable.hasMore}
        isLoading={clientTable.isLoadingMore}
        error={clientTable.loadMoreError}
        onLoadMore={clientTable.loadMore}
      />
    </div>
  );
}
