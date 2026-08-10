"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { useAppStore } from "@/lib/store";
import type { Invoice } from "@/lib/types";

export function InvoiceRowActions({ invoice }: { invoice: Invoice }) {
  const sendInvoice = useAppStore((s) => s.sendInvoice);
  const markInvoicePaid = useAppStore((s) => s.markInvoicePaid);
  const voidInvoice = useAppStore((s) => s.voidInvoice);
  const [voidOpen, setVoidOpen] = useState(false);

  const canSend = invoice.status === "DRAFT";
  const canMarkPaid = !["PAID", "VOIDED", "REFUNDED"].includes(invoice.status);
  const canVoid = invoice.status !== "PAID" && invoice.status !== "VOIDED";

  if (!canSend && !canMarkPaid && !canVoid) {
    return <span className="text-[12px] text-muted-foreground">—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {canSend && (
            <DropdownMenuItem onClick={() => sendInvoice(invoice.id)}>Send invoice</DropdownMenuItem>
          )}
          {canMarkPaid && (
            <DropdownMenuItem onClick={() => markInvoicePaid(invoice.id)}>Mark as paid</DropdownMenuItem>
          )}
          {canVoid && (
            <DropdownMenuItem variant="destructive" onClick={() => setVoidOpen(true)}>
              Void invoice
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title="Void this invoice?"
        description={`"${invoice.label}" will be marked void and can no longer be paid. This can't be undone.`}
        confirmLabel="Void invoice"
        onConfirm={() => {
          const ok = voidInvoice(invoice.id);
          if (!ok) toast.error("Can't void a paid invoice.");
        }}
      />
    </>
  );
}
