"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Mail, Phone } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceDisplayLabelKey, invoiceDisplayTone, PROJECT_STATUS_TONE } from "@/lib/status";
import type { ClientDetail } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import { DashboardErrorState } from "@/components/dashboard/dashboard-error-state";

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClient = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchJson<ClientDetail>(
        `/api/clients/${encodeURIComponent(id)}`,
        "We couldn't load this client.",
        signal,
      );
      if (!data || !Array.isArray(data.projects) || !Array.isArray(data.invoices)) {
        throw new Error("The server returned an unexpected client response.");
      }
      if (!signal?.aborted) setClient(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this client.");
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadClient(controller.signal));
    return () => controller.abort();
  }, [loadClient]);

  if (isLoading) return <DetailState label={t("project.loadingClient")} />;
  if (error) return <DetailError error={error} onRetry={() => void loadClient()} />;
  if (!client) return <DetailState label={t("project.clientNotFound")} />;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <div>
        <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{client.companyName}</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">{t("project.clientSince", { date: formatDate(client.createdAt) })}</p>
      </div>

      <section className="rounded-lg border border-border p-5 dark:bg-card">
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div><dt className="text-[12px] text-muted-foreground">{t("clients.contact")}</dt><dd className="mt-1 text-[13px]">{client.contactName}</dd></div>
          <div><dt className="text-[12px] text-muted-foreground">{t("auth.email")}</dt><dd className="mt-1 flex items-center gap-1.5 text-[13px]"><Mail className="size-3.5 text-muted-foreground" />{client.email}</dd></div>
          <div><dt className="text-[12px] text-muted-foreground">{t("clients.phone")}</dt><dd className="mt-1 flex items-center gap-1.5 text-[13px]"><Phone className="size-3.5 text-muted-foreground" />{client.phone ?? "—"}</dd></div>
        </dl>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[15px] font-medium">{t("clients.projects")}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="px-4 py-2.5 font-normal">{t("projects.project")}</th><th className="px-4 py-2.5 font-normal">{t("projects.package")}</th><th className="px-4 py-2.5 font-normal">{t("common.status")}</th><th className="px-4 py-2.5 text-right font-normal">{t("projects.updated")}</th></tr></thead><tbody>
            {client.projects.map((project) => <tr key={project.id} className="border-b border-border last:border-0"><td className="px-4 py-3"><Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-brand-accent">{project.name}</Link></td><td className="px-4 py-3 text-muted-foreground">{project.package?.name ?? t("projects.customProject")}</td><td className={`px-4 py-3 ${PROJECT_STATUS_TONE[project.status]}`}>{t(`status.project.${project.status}`)}</td><td className="px-4 py-3 text-right text-muted-foreground">{formatDate(project.updatedAt)}</td></tr>)}
            {client.projects.length === 0 && <EmptyRow colSpan={4} text={t("project.noClientProjects")} />}
          </tbody></table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-[15px] font-medium">{t("dashboard.invoices")}</h2>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[13px]"><thead><tr className="border-b border-border text-left text-[12px] text-muted-foreground"><th className="px-4 py-2.5 font-normal">{t("invoices.invoice")}</th><th className="px-4 py-2.5 font-normal">{t("invoices.project")}</th><th className="px-4 py-2.5 text-right font-normal">{t("common.amount")}</th><th className="px-4 py-2.5 font-normal">{t("common.status")}</th><th className="px-4 py-2.5 font-normal">{t("invoices.sent")}</th><th className="px-4 py-2.5 text-right font-normal">{t("invoices.due")}</th></tr></thead><tbody>
            {client.invoices.map((invoice) => <tr key={invoice.id} className="border-b border-border last:border-0"><td className="px-4 py-3 font-medium">{invoice.label}</td><td className="px-4 py-3"><Link href={`/dashboard/projects/${invoice.projectId}`} className="text-muted-foreground hover:text-brand-accent">{client.projects.find((project) => project.id === invoice.projectId)?.name ?? t("project.viewProject")}</Link></td><td className="px-4 py-3 text-right tabular-nums">{formatCurrency(invoice.amountCents)}</td><td className={`px-4 py-3 ${invoiceDisplayTone(invoice)}`}>{t(invoiceDisplayLabelKey(invoice))}</td><td className="px-4 py-3 text-muted-foreground">{invoice.issuedAt ? formatDate(invoice.issuedAt) : "—"}</td><td className="px-4 py-3 text-right text-muted-foreground">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</td></tr>)}
            {client.invoices.length === 0 && <EmptyRow colSpan={6} text={t("project.noClientInvoices")} />}
          </tbody></table>
        </div>
      </section>
    </div>
  );
}

function BackLink() { const { t } = useLocale(); return <Link href="/dashboard/clients" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />{t("project.clientBack")}</Link>; }
function EmptyRow({ colSpan, text }: { colSpan: number; text: string }) { return <tr><td colSpan={colSpan} className="px-4 py-10 text-center text-muted-foreground">{text}</td></tr>; }
function DetailState({ label }: { label: string }) { const { t } = useLocale(); return <div className="flex flex-col gap-6"><BackLink /><div className="flex min-h-56 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground">{label === t("project.loadingClient") && <LoaderCircle className="size-4 animate-spin text-brand-accent" />}{label}</div></div></div>; }
function DetailError({ error, onRetry }: { error: string; onRetry: () => void }) { const { t } = useLocale(); return <DashboardErrorState title={t("project.clientLoadFailed")} error={error} onRetry={onRetry} backLink={<BackLink />} className="min-h-56" />; }
