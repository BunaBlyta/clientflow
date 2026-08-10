"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAppStore } from "@/lib/store";
import { getClient, getProject } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/format";
import { invoiceDisplayLabel, invoiceDisplayTone } from "@/lib/status";
import { TableToolbar } from "@/components/dashboard/table-toolbar";
import { CreateInvoiceDialog } from "@/components/dashboard/create-invoice-dialog";
import { InvoiceRowActions } from "@/components/dashboard/invoice-row-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InvoiceStatus } from "@/lib/types";

const STATUS_FILTERS: { value: InvoiceStatus | "ALL" | "OVERDUE"; label: string }[] = [
  { value: "ALL", label: "All statuses" },
  { value: "DRAFT", label: "Draft" },
  { value: "SENT", label: "Sent" },
  { value: "PAYMENT_PENDING", label: "Payment pending" },
  { value: "OVERDUE", label: "Overdue" },
  { value: "PAID", label: "Paid" },
  { value: "FAILED", label: "Failed" },
  { value: "VOIDED", label: "Voided" },
  { value: "REFUNDED", label: "Refunded" },
];

export default function InvoicesPage() {
  const invoices = useAppStore((s) => s.invoices);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | "ALL" | "OVERDUE">("ALL");

  const filtered = useMemo(() => {
    return invoices
      .filter((inv) => {
        if (statusFilter === "ALL") return true;
        if (statusFilter === "OVERDUE") return invoiceDisplayLabel(inv) === "Overdue";
        return inv.status === statusFilter;
      })
      .filter((inv) => {
        const project = getProject(inv.projectId);
        const client = project ? getClient(project.clientId) : undefined;
        const haystack = `${inv.label} ${project?.name ?? ""} ${client?.companyName ?? ""}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [invoices, search, statusFilter]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight sm:text-[22px]">Invoices</h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Every deposit, final, and extra invoice across all projects.
          </p>
        </div>
        <CreateInvoiceDialog />
      </div>

      <TableToolbar search={search} onSearchChange={setSearch} placeholder="Search invoices...">
        <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableToolbar>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th className="px-4 py-2.5 font-normal">Invoice</th>
              <th className="px-4 py-2.5 font-normal">Project</th>
              <th className="px-4 py-2.5 font-normal">Client</th>
              <th className="px-4 py-2.5 text-right font-normal">Amount</th>
              <th className="px-4 py-2.5 font-normal">Status</th>
              <th className="px-4 py-2.5 text-right font-normal">Due</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((inv) => {
              const project = getProject(inv.projectId);
              const client = project ? getClient(project.clientId) : undefined;
              return (
                <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium">{inv.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {project && (
                      <Link href={`/dashboard/projects/${project.id}`} className="hover:text-brand-accent">
                        {project.name}
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{client?.companyName}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatCurrency(inv.amountCents)}</td>
                  <td className="px-4 py-3">
                    <span className={invoiceDisplayTone(inv)}>{invoiceDisplayLabel(inv)}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-muted-foreground">
                    {inv.dueDate ? formatDate(inv.dueDate) : "—"}
                  </td>
                  <td className="px-2 py-3 text-right">
                    <InvoiceRowActions invoice={inv} />
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                  No invoices match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
