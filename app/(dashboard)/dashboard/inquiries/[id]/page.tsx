"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Mail, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { formatDate } from "@/lib/format";
import { PROJECT_STATUS_TONE } from "@/lib/status";
import { useLocale } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { CustomLeadDetail } from "@/lib/types";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<CustomLeadDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const loadInquiry = useCallback(async (signal?: AbortSignal) => {
    setIsLoading(true); setError(null);
    try {
      const data = await fetchJson<CustomLeadDetail>(`/api/contact-leads/${encodeURIComponent(id)}`, "We couldn't load this inquiry.", signal);
      if (!data || !Array.isArray(data.projects)) throw new Error("The server returned an unexpected inquiry response.");
      if (!signal?.aborted) setInquiry(data);
    } catch (caughtError) {
      if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
      if (!signal?.aborted) setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this inquiry.");
    } finally { if (!signal?.aborted) setIsLoading(false); }
  }, [id]);
  useEffect(() => { const controller = new AbortController(); void Promise.resolve().then(() => loadInquiry(controller.signal)); return () => controller.abort(); }, [loadInquiry]);
  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      if (detail?.entity !== "lead" || detail.id !== id) return;
      void fetchJson<CustomLeadDetail>(
        `/api/contact-leads/${encodeURIComponent(id)}`,
        "We couldn't refresh this inquiry.",
      ).then(setInquiry).catch(() => undefined);
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [id]);

  if (isLoading) return <State label="Loading inquiry…" />;
  if (error) return <ErrorState error={error} onRetry={() => void loadInquiry()} />;
  if (!inquiry) return <State label="This inquiry doesn't exist." />;

  return <div className="flex flex-col gap-6">
    <BackLink />
    <div><h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{inquiry.name}</h1><p className="mt-1 text-[13px] text-muted-foreground">Custom inquiry received {formatDate(inquiry.createdAt)}</p></div>
    <section className="rounded-lg border border-border p-5"><h2 className="text-[15px] font-medium">Inquiry information</h2><dl className="mt-4 grid gap-4 sm:grid-cols-2"><div><dt className="text-[12px] text-muted-foreground">Prospect</dt><dd className="mt-1 text-[13px]">{inquiry.name}</dd></div><div><dt className="text-[12px] text-muted-foreground">Email</dt><dd className="mt-1 flex items-center gap-1.5 text-[13px]"><Mail className="size-3.5 text-muted-foreground" />{inquiry.email}</dd></div></dl><div className="mt-5 border-t border-border pt-4"><dt className="text-[12px] text-muted-foreground">Brief</dt><dd className="mt-1 whitespace-pre-wrap text-[13px]">{inquiry.message}</dd></div></section>
    <section className="flex flex-col gap-4"><h2 className="text-[15px] font-medium">Conversion and projects</h2>{inquiry.client ? <div className="rounded-lg border border-border p-5"><p className="text-[13px]">A client with this inquiry&apos;s email exists: <Link className="font-medium hover:text-brand-accent" href={`/dashboard/clients/${inquiry.client.id}`}>{inquiry.client.companyName}</Link>.</p><p className="mt-1 text-[12px] text-muted-foreground">This is an email match, not proof that the inquiry itself was converted.</p><ProjectList projects={inquiry.projects} /></div> : <p className="text-[13px] text-muted-foreground">No client currently matches this inquiry&apos;s email.</p>}</section>
  </div>;
}

function ProjectList({ projects }: { projects: CustomLeadDetail["projects"] }) { const { t } = useLocale(); return <div className="mt-4 border-t border-border pt-4">{projects.length ? <div className="flex flex-col gap-2">{projects.map((project) => <Link key={project.id} href={`/dashboard/projects/${project.id}`} className="flex items-center justify-between gap-4 text-[13px] hover:text-brand-accent"><span>{project.name}</span><span className={PROJECT_STATUS_TONE[project.status]}>{t(`status.project.${project.status}`)}</span></Link>)}</div> : <p className="text-[12px] text-muted-foreground">{t("project.noRelated")}</p>}</div>; }
function BackLink() { return <Link href="/dashboard/projects?tab=custom" className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" />Custom inquiries</Link>; }
function State({ label }: { label: string }) { return <div className="flex flex-col gap-6"><BackLink /><div className="flex min-h-56 items-center justify-center border border-border"><div className="flex items-center gap-2 text-[13px] text-muted-foreground">{label === "Loading inquiry…" && <LoaderCircle className="size-4 animate-spin text-brand-accent" />}{label}</div></div></div>; }
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) { return <div className="flex flex-col gap-6"><BackLink /><div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center"><p className="text-[13px] font-medium text-status-danger">Inquiry couldn&apos;t load</p><p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p><Button className="mt-4" variant="outline" size="sm" onClick={onRetry}><RefreshCw />Try again</Button></div></div>; }
