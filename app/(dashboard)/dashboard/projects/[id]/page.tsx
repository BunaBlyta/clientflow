"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle, Mail, Phone, RefreshCw } from "lucide-react";
import { fetchJson } from "@/lib/fetch-json";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatMajorCurrency, initials } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";
import { invoiceDisplayLabelKey, invoiceDisplayTone } from "@/lib/status";
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu";
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import { Button } from "@/components/ui/button";
import { NoteComposer } from "@/components/dashboard/note-composer";
import type { Client, Invoice, Note, Project } from "@/lib/types";
import { useLocale } from "@/lib/i18n";
import type { EntityChangedEvent } from "@/lib/realtime-notification-store";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLocale();
  const projectId = params.id;
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [isPostingNote, setIsPostingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sortedNotes = useMemo(
    () =>
      notes
        .slice()
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [notes]
  );

  const fetchNotes = useCallback(
    (signal?: AbortSignal) =>
      fetchJson<Note[]>(
        `/api/notes?projectId=${encodeURIComponent(projectId)}`,
        "We couldn't load the project activity.",
        signal,
      ),
    [projectId],
  );

  const loadProject = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);

      try {
        const [projectData, clientData, notesData, invoiceData] = await Promise.all([
          fetchJson<Project>(
            `/api/projects/${encodeURIComponent(projectId)}`,
            "We couldn't load this project.",
            signal,
          ),
          fetchJson<Client[]>("/api/clients", "We couldn't load the client list.", signal),
          fetchNotes(signal),
          fetchJson<Invoice[]>(
            `/api/invoices?projectId=${encodeURIComponent(projectId)}`,
            "We couldn't load this project's invoices.",
            signal,
          ),
        ]);

        if (!Array.isArray(clientData) || !Array.isArray(notesData) || !Array.isArray(invoiceData)) {
          throw new Error("The server returned an unexpected project response.");
        }

        if (!signal?.aborted) {
          setProject(projectData);
          setClient(clientData.find((currentClient) => currentClient.id === projectData.clientId) ?? null);
          setInvoices(invoiceData);
          setNotes(notesData);
        }
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === "AbortError") return;
        if (!signal?.aborted) {
          setError(caughtError instanceof Error ? caughtError.message : "We couldn't load this project.");
        }
      } finally {
        if (!signal?.aborted) setIsLoading(false);
      }
    },
    [fetchNotes, projectId],
  );

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => loadProject(controller.signal));
    return () => controller.abort();
  }, [loadProject]);

  useEffect(() => {
    const handleEntityChanged = (event: Event) => {
      const detail = (event as CustomEvent<EntityChangedEvent>).detail;
      const isRelevant =
        detail?.projectId === projectId ||
        (detail?.entity === "project" && detail.projectId === projectId);
      if (isRelevant) void loadProject();
    };
    window.addEventListener("clientflow:entity-changed", handleEntityChanged);
    return () => window.removeEventListener("clientflow:entity-changed", handleEntityChanged);
  }, [loadProject, projectId]);

  const handleProjectUpdated = useCallback(
    (updatedProject: Project) => {
      setProject(updatedProject);

      // Re-read the feed after the PATCH transaction completes; do not predict or append its note locally.
      void fetchNotes()
        .then(setNotes)
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the project activity.");
        });
    },
    [fetchNotes],
  );

  const handleInvoiceUpdated = useCallback((updatedInvoice: Invoice) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    );
  }, []);

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const body = noteBody.trim();
    if (!body) return;

    setIsPostingNote(true);
    setNoteError(null);
    setNoteSuccess(null);
    try {
      const createdNote = await fetchJson<Note>("/api/notes", "We couldn't post this note.", undefined, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, body }),
      });
      setNotes((currentNotes) => [...currentNotes, createdNote]);
      setNoteBody("");
      setNoteSuccess(t("project.notePosted"));
    } catch (caughtError) {
      setNoteError(caughtError instanceof Error ? caughtError.message : "We couldn't post this note.");
    } finally {
      setIsPostingNote(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex min-h-56 items-center justify-center border border-border">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-brand-accent" />
            {t("projects.loading")}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex min-h-56 flex-col items-center justify-center border border-status-danger/30 px-6 text-center">
          <p className="text-[13px] font-medium text-status-danger">{t("dashboard.projectsLoadFailed")}</p>
          <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadProject()}>
            <RefreshCw />
            {t("common.tryAgain")}
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-[13px] text-muted-foreground">
          This project doesn&apos;t exist, or was never created.
        </p>
      </div>
    );
  }

  const pkg = project.package;

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">{project.name}</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {client?.companyName} · {pkg?.name}
          </p>
        </div>
        <ProjectStatusMenu project={project} onProjectUpdated={handleProjectUpdated} />
      </div>

      <div className="rounded-lg border border-border p-5 dark:bg-card">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[12px] text-muted-foreground">{t("projects.client")}</dt>
            <dd className="mt-1 text-[13px] font-medium">{client?.companyName ?? "—"}</dd>
            <dd className="text-[12px] text-muted-foreground">{client?.contactName}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">{t("clients.contact")}</dt>
            {client?.email && (
              <dd className="mt-1 flex items-center gap-1.5 text-[13px]">
                <Mail className="size-3.5 text-muted-foreground" />
                {client.email}
              </dd>
            )}
            {client?.phone && (
              <dd className="mt-1 flex items-center gap-1.5 text-[13px] text-muted-foreground">
                <Phone className="size-3.5" />
                {client.phone}
              </dd>
            )}
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">{t("projects.package")}</dt>
            <dd className="mt-1 text-[13px] font-medium">{pkg?.name ?? "—"}</dd>
            <dd className="text-[12px] text-muted-foreground">
              {pkg ? formatMajorCurrency(pkg.price, pkg.currency) : "Custom pricing"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">{t("project.timeline")}</dt>
            <dd className="mt-1 text-[13px]">Created {formatDate(project.createdAt)}</dd>
            <dd className="text-[12px] text-muted-foreground">
              {project.targetLaunchDate
                ? `Target launch ${formatDate(project.targetLaunchDate)}`
                : "No target launch date"}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-medium">{t("dashboard.invoices")}</h2>
          <CreateInvoiceDialog
            projectId={project.id}
            currency={project.package?.currency ?? "usd"}
            onCreated={(createdInvoice) => setInvoices((currentInvoices) => [createdInvoice, ...currentInvoices])}
          />
        </div>
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
                <th className="px-4 py-2.5 font-normal">{t("invoices.invoice")}</th>
                <th className="px-4 py-2.5 text-right font-normal">{t("common.amount")}</th>
                <th className="px-4 py-2.5 font-normal">{t("common.status")}</th>
                <th className="px-4 py-2.5 font-normal">{t("invoices.sent")}</th>
                <th className="px-4 py-2.5 text-right font-normal">{t("invoices.due")}</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {invoices
                .slice()
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                    <td className="px-4 py-3 font-medium">{inv.label}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.amountCents)}</td>
                    <td className="px-4 py-3">
                      <span className={invoiceDisplayTone(inv)}>{t(invoiceDisplayLabelKey(inv))}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {inv.issuedAt ? formatDate(inv.issuedAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-muted-foreground">
                      {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                    </td>
                    <td className="px-2 py-3 text-right">
                      <InvoiceRowActions invoice={inv} onInvoiceUpdated={handleInvoiceUpdated} />
                    </td>
                  </tr>
                ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    No invoices for this project yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[15px] font-medium">{t("project.activity")}</h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border p-5 dark:bg-card">
          {sortedNotes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">{t("project.noActivity")}</p>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedNotes.map((note, index) => {
                const previous = sortedNotes[index - 1];
                const startsNewDay =
                  !previous || formatDate(previous.createdAt) !== formatDate(note.createdAt);

                return (
                  <div key={note.id} className="flex flex-col gap-4">
                    {startsNewDay && (
                      <div className="flex items-center gap-3">
                        <span className="h-px flex-1 bg-border" />
                        <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                          {formatDate(note.createdAt)}
                        </span>
                        <span className="h-px flex-1 bg-border" />
                      </div>
                    )}

                    {note.authorRole === "SYSTEM" ? (
                      <div className="flex items-center gap-3 text-[12px] text-muted-foreground">
                        <span className="flex size-7 shrink-0 items-center justify-center">
                          <ArrowRight className="size-3.5" />
                        </span>
                        <span className="italic">
                          {note.body}
                          <span className="not-italic"> · {formatRelativeTime(note.createdAt)}</span>
                        </span>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <span
                          className={cn(
                            "mt-px flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-medium",
                            note.authorRole === "CLIENT"
                              ? "bg-brand-accent/15 text-brand-accent"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          {initials(note.authorName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-2 text-[12px] text-muted-foreground">
                            <span className="font-medium text-foreground">{note.authorName}</span>
                            <span aria-hidden="true">·</span>
                            <span>{formatRelativeTime(note.createdAt)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/90">
                            {note.body}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleNoteSubmit} className="flex flex-col gap-2 border-t border-border pt-4">
            <NoteComposer
              placeholder={t("project.notePlaceholder")}
              value={noteBody}
              onChange={(next) => {
                setNoteBody(next);
                setNoteSuccess(null);
              }}
              disabled={isPostingNote}
            />
            {noteError && (
              <p role="alert" className="text-[12px] text-status-danger">{noteError}</p>
            )}
            {noteSuccess && <p className="text-[12px] text-status-success">{noteSuccess}</p>}
            <Button type="submit" size="sm" className="self-end" disabled={isPostingNote || !noteBody.trim()}>
              {isPostingNote ? t("project.posting") : t("project.postNote")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard/projects"
      className="inline-flex w-fit items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" />
      Projects
    </Link>
  );
}
