"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, LoaderCircle, Mail, Phone, RefreshCw, X } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate, formatMajorCurrency } from "@/lib/format";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import type { ProjectRequestDetail } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLocale();
  const [request, setRequest] = useState<ProjectRequestDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const loadRequest = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchJson<ProjectRequestDetail>(`/api/requests/${encodeURIComponent(id)}`, "We couldn't load this request.", signal);
      if (!data || !Array.isArray(data.projects)) throw new Error("The server returned an unexpected request response.");
      if (!signal?.aborted) setRequest(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this request.");
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => loadRequest(controller.signal)); return () => controller.abort(); }, [loadRequest]);

  async function updateRequest(status: "APPROVED" | "REJECTED") {
    setUpdatingStatus(status);
    setError(null);
    try {
      await fetchJson<unknown>(
        `/api/requests/${encodeURIComponent(id)}`,
        "We couldn't update this request.",
        undefined,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      setIsRejectDialogOpen(false);
      await loadRequest();
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "We couldn't update this request.");
    } finally {
      setUpdatingStatus(null);
    }
  }

  if (isLoading) return <State label={t("projects.requestsLoading")} />;
  if (error) return <ErrorState error={error} onRetry={() => void loadRequest()} />;
  if (!request) return <State label={t("request.notFound")} />;
  const statusTone = request.status === "PENDING" ? "text-status-warning" : request.status === "APPROVED" ? "text-status-success" : "text-muted-foreground";

  return <div className="flex flex-col gap-6">
    <BackLink />
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{request.companyName ?? request.prospectName}</h1><p className="mt-1 text-[13px] text-muted-foreground">{t("request.from", { name: request.prospectName })}</p></div>{request.status === "PENDING" && <div className="flex items-center gap-2"><Button variant="outline" onClick={() => void updateRequest("APPROVED")} disabled={updatingStatus !== null}><Check className="text-status-success" />{updatingStatus === "APPROVED" ? t("request.accepting") : t("projects.accept")}</Button><Button variant="outline" onClick={() => setIsRejectDialogOpen(true)} disabled={updatingStatus !== null}><X className="text-status-danger" />{t("projects.deny")}</Button></div>}</div>
    <section className="rounded-lg border border-border p-5"><dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <div><dt className="text-[12px] text-muted-foreground">{t("common.status")}</dt><dd className={`mt-1 text-[13px] ${statusTone}`}>{t(`status.request.${request.status}`)}</dd></div>
      <div><dt className="text-[12px] text-muted-foreground">{t("projects.package")}</dt><dd className="mt-1 text-[13px] font-medium">{request.package?.name ?? t("common.unknown")}</dd><dd className="text-[12px] text-muted-foreground">{request.package ? formatMajorCurrency(request.package.price, request.package.currency) : "—"}</dd></div>
      <div><dt className="text-[12px] text-muted-foreground">{t("projects.submitted")}</dt><dd className="mt-1 text-[13px]">{formatDate(request.createdAt)}</dd></div>
      <div><dt className="text-[12px] text-muted-foreground">{t("request.reviewed")}</dt><dd className="mt-1 text-[13px]">{request.reviewedAt ? formatDate(request.reviewedAt) : t("request.notReviewed")}</dd></div>
    </dl></section>
    <section className="rounded-lg border border-border p-5"><h2 className="text-[15px] font-medium">Prospect information</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-[12px] text-muted-foreground">Name</dt><dd className="mt-1 text-[13px]">{request.prospectName}</dd></div><div><dt className="text-[12px] text-muted-foreground">Email</dt><dd className="mt-1 flex items-center gap-1.5 text-[13px]"><Mail className="size-3.5 text-muted-foreground" />{request.prospectEmail}</dd></div><div><dt className="text-[12px] text-muted-foreground">Phone</dt><dd className="mt-1 flex items-center gap-1.5 text-[13px]"><Phone className="size-3.5 text-muted-foreground" />{request.prospectPhone ?? "—"}</dd></div></dl>{request.message && <div className="mt-5 border-t border-border pt-4"><dt className="text-[12px] text-muted-foreground">Request message</dt><dd className="mt-1 whitespace-pre-wrap text-[13px]">{request.message}</dd></div>}</section>
    <section className="flex flex-col gap-4"><h2 className="text-[15px] font-medium">Linked client and projects</h2>{request.client ? <div className="rounded-lg border border-border p-5"><p className="text-[13px]">This request is linked to <Link className="font-medium hover:text-brand-accent" href={`/dashboard/clients/${request.client.id}`}>{request.client.companyName}</Link>.</p><ProjectList projects={request.projects} /></div> : <p className="text-[13px] text-muted-foreground">No client has been linked to this request.</p>}</section>
    <ConfirmDialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen} title={t("request.denyTitle")} description={t("projects.rejectDescription")} confirmLabel={t("projects.rejectConfirm")} onConfirm={() => void updateRequest("REJECTED")} />
  </div>;
}

function ProjectList({ projects }: { projects: ProjectRequestDetail["projects"] }) { const { t } = useLocale(); return <div className="mt-4 border-t border-border pt-4">{projects.length ? <div className="flex flex-col gap-2">{projects.map((project) => <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="flex items-center justify-between gap-4 text-[13px] hover:text-brand-accent"><span>{project.name}</span><span className={PROJECT_STATUS_TONE[project.status]}>{t(`status.project.${project.status}`)}</span></Link>)}</div> : <p className="text-[12px] text-muted-foreground">{t("project.noRelated")}</p>}</div>; }
function BackLink() { return <Link href="/dashboard/projects?tab=requests" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Requests</Link>; }
function State({ label }: { label: string }) { return <div className="flex flex-col gap-6"><BackLink /><div className="flex min-h-56 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground">{label === "Loading request…" && <LoaderCircle className="size-4 animate-spin text-brand-accent" />}{label}</div></div></div>; }
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) { return <div className="flex flex-col gap-6"><BackLink /><div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">Request couldn&apos;t load</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><RefreshCw />Try again</Button></div></div>; }
