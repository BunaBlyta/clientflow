"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { useAppStore } from "@/lib/store";
import { getClient, getPackage } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatRelativeTime } from "@/lib/relative-time";
import { invoiceDisplayLabel, invoiceDisplayTone } from "@/lib/status";
import { ProjectStatusMenu } from "@/components/dashboard/project-status-menu";
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const projects = useAppStore((s) => s.projects);
  const allInvoices = useAppStore((s) => s.invoices);
  const allNotes = useAppStore((s) => s.notes);
  const addNote = useAppStore((s) => s.addNote);
  const applyProjectUpdate = useAppStore((s) => s.applyProjectUpdate);
  const applyInvoiceUpdate = useAppStore((s) => s.applyInvoiceUpdate);
  const [draft, setDraft] = useState("");

  const project = projects.find((p) => p.id === params.id);
  const invoices = useMemo(
    () => allInvoices.filter((i) => i.projectId === params.id),
    [allInvoices, params.id]
  );
  const sortedNotes = useMemo(
    () =>
      allNotes
        .filter((n) => n.projectId === params.id)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()),
    [allNotes, params.id]
  );

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

  const client = getClient(project.clientId);
  const pkg = getPackage(project.packageId);

  function handleAddNote(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim() || !project) return;
    addNote(project.id, draft.trim());
    setDraft("");
  }

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
        <ProjectStatusMenu project={project} onProjectUpdated={applyProjectUpdate} />
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
              {pkg && (pkg.isCustom ? "Custom pricing" : formatCurrency(pkg.priceCents!))}
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
          <CreateInvoiceDialog projectId={project.id} />
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
                      <InvoiceRowActions invoice={inv} onInvoiceUpdated={applyInvoiceUpdate} />
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

          <form onSubmit={handleAddNote} className="flex flex-col gap-2 border-t border-border pt-4">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note for this project…"
              rows={2}
            />
            <Button type="submit" size="sm" className="self-end" disabled={!draft.trim()}>
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
