"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { LoaderCircle, MoreHorizontal, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency, formatDate, initials } from "@/lib/format";
import { isTableRowInteractiveTarget } from "@/lib/table-navigation";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { Client, Invoice, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

type ApiInvoice = Invoice & { clientId: string };

export default function ClientsPage() {
  const { t } = useLocale();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<ApiInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [resendingClientId, setResendingClientId] = useState<string | null>(null);
  const [resendError, setResendError] = useState<{ clientId: string; message: string } | null>(null);

  const loadClients = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);

    try {
      const [clientData, projectData, invoiceData] = await Promise.all([
        fetchJson<Client[]>("/api/clients", "We couldn't load the clients.", signal),
        fetchJson<Project[]>("/api/projects", "We couldn't load the projects.", signal),
        fetchJson<ApiInvoice[]>("/api/invoices", "We couldn't load the invoices.", signal),
      ]);

      if (!Array.isArray(clientData) || !Array.isArray(projectData) || !Array.isArray(invoiceData)) {
        throw new Error("The server returned an unexpected clients response.");
      }

      if (!signal?.aborted) {
        setClients(clientData);
        setProjects(projectData);
        setInvoices(invoiceData);
      }
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) {
        setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the clients.");
      }
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadClients(controller.signal));
    return () => controller.abort();
  }, [loadClients]);

  const filtered = useMemo(() => {
    return clients
      .filter((c) => {
        const haystack = `${c.companyName} ${c.contactName} ${c.email}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => a.companyName.localeCompare(b.companyName));
  }, [clients, search]);

  const billedByClient = useMemo(() => {
    const projectClient = new Map(projects.map((project) => [project.id, project.clientId]));
    const totals = new Map<string, number>();
    for (const invoice of invoices) {
      if (invoice.status !== "PAID") continue;
      const clientId = projectClient.get(invoice.projectId) ?? invoice.clientId;
      totals.set(clientId, (totals.get(clientId) ?? 0) + invoice.amountCents);
    }
    return totals;
  }, [invoices, projects]);

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
        <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadClients()}>
          <RefreshCw />
          {t("common.tryAgain")}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <TableToolbar search={search} onSearchChange={setSearch} placeholder={t("clients.search")} />

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">{t("clients.company")}</th>
              <th className="px-4 py-2.5 font-normal">{t("clients.contact")}</th>
              <th className="px-4 py-2.5 font-normal">{t("clients.projects")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("clients.totalBilled")}</th>
              <th className="px-4 py-2.5 text-right font-normal">{t("clients.since")}</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((client) => {
              const clientProjects = projects.filter((p) => p.clientId === client.id);
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
                  <td className="px-4 py-3 text-muted-foreground">{clientProjects.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {formatCurrency(billedByClient.get(client.id) ?? 0)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {formatDate(client.createdAt)}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem
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
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                  {t("clients.noMatch")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
