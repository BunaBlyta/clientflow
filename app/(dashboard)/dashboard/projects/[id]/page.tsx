"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, LoaderCircle, Mail, Phone, RefreshCw } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { formatCurrency, formatDate, formatMajorCurrency } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";
import { invoiceDisplayLabel, invoiceDisplayTone } from "@/lib/status";
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu";
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Client, Invoice, Note, Project } from "@/lib/types";

async function fetchJson<T>(url: string, fallbackError: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallbackError;
    throw new Error(message);
  }

  if (payload === null || typeof payload !== "object") {
    throw new Error(fallbackError);
  }

  return payload as T;
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params.id;
  const applyProjectUpdate = useAppStore((s) => s.applyProjectUpdate);
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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

  const handleProjectUpdated = useCallback(
    (updatedProject: Project) => {
      setProject(updatedProject);
      applyProjectUpdate(updatedProject);

      // Re-read the feed after the PATCH transaction completes; do not predict or append its note locally.
      void fetchNotes()
        .then(setNotes)
        .catch((caughtError) => {
          setError(caughtError instanceof Error ? caughtError.message : "We couldn't load the project activity.");
        });
    },
    [applyProjectUpdate, fetchNotes],
  );

  const handleInvoiceUpdated = useCallback((updatedInvoice: Invoice) => {
    setInvoices((currentInvoices) =>
      currentInvoices.map((invoice) =>
        invoice.id === updatedInvoice.id ? updatedInvoice : invoice,
      ),
    );
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <BackLink />
        <div className="flex min-h-56 items-center justify-center border border-border">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-brand-accent" />
            Loading project…
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
          <p className="text-[13px] font-medium text-status-danger">Project couldn&apos;t load</p>
          <p className="mt-1 max-w-sm text-[12px] text-muted-foreground">{error}</p>
          <Button className="mt-4" variant="outline" size="sm" onClick={() => void loadProject()}>
            <RefreshCw />
            Try again
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

      <div className="rounded-lg border border-border p-5">
        <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-[12px] text-muted-foreground">Client</dt>
            <dd className="mt-1 text-[13px] font-medium">{client?.companyName ?? "—"}</dd>
            <dd className="text-[12px] text-muted-foreground">{client?.contactName}</dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Contact</dt>
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
            <dt className="text-[12px] text-muted-foreground">Package</dt>
            <dd className="mt-1 text-[13px] font-medium">{pkg?.name ?? "—"}</dd>
            <dd className="text-[12px] text-muted-foreground">
              {pkg ? formatMajorCurrency(pkg.price, pkg.currency) : "Custom pricing"}
            </dd>
          </div>
          <div>
            <dt className="text-[12px] text-muted-foreground">Timeline</dt>
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
          <h2 className="text-[15px] font-medium">Invoices</h2>
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
                <th className="px-4 py-2.5 font-normal">Invoice</th>
                <th className="px-4 py-2.5 text-right font-normal">Amount</th>
                <th className="px-4 py-2.5 font-normal">Status</th>
                <th className="px-4 py-2.5 text-right font-normal">Due</th>
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
                      <span className={invoiceDisplayTone(inv)}>{invoiceDisplayLabel(inv)}</span>
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
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                    No invoices for this project yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="text-[15px] font-medium">Activity</h2>
        <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
          {sortedNotes.length === 0 ? (
            <p className="text-[13px] text-muted-foreground">No activity yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedNotes.map((note) => (
                <div key={note.id} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
                    <span
                      className={
                        note.authorRole === "SYSTEM" ? "text-muted-foreground" : "font-medium text-foreground"
                      }
                    >
                      {note.authorName}
                    </span>
                    <span>·</span>
                    <span>{formatRelativeTime(note.createdAt)}</span>
                  </div>
                  <p
                    className={
                      note.authorRole === "SYSTEM"
                        ? "text-[13px] text-muted-foreground italic"
                        : "text-[13px]"
                    }
                  >
                    {note.body}
                  </p>
                </div>
              ))}
            </div>
          )}

          <form className="flex flex-col gap-2 border-t border-border pt-4">
            <Textarea
              placeholder="Add a note for this project…"
              rows={2}
              disabled
            />
            <p className="text-[12px] text-muted-foreground">Posting notes isn&apos;t wired up yet.</p>
            <Button type="button" size="sm" className="self-end" disabled>
              Post note
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
