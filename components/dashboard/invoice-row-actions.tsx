"use client";

import { useState } from "react";
import { LoaderCircle, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/dashboard/confirm-dialog";
import { patchJson } from "@/lib/api-client";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { useLocale } from "@/lib/i18n";

const VOIDABLE_STATUSES: readonly InvoiceStatus[] = [
  "DRAFT",
  "SENT",
  "PAYMENT_PENDING",
  "FAILED",
];

export function InvoiceRowActions({
  invoice,
  onInvoiceUpdated,
}: {
  invoice: Invoice;
  onInvoiceUpdated: (invoice: Invoice) => void;
}) {
  const [voidOpen, setVoidOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useLocale();

  const canSend = invoice.status === "DRAFT";
  const canVoid = VOIDABLE_STATUSES.includes(invoice.status);

  async function updateStatus(status: "SENT" | "VOIDED") {
    setIsUpdating(true);
    onInvoiceUpdated({
      ...invoice,
      status,
      ...(status === "SENT" && !invoice.issuedAt ? { issuedAt: new Date().toISOString() } : {}),
    });

    try {
      const updatedInvoice = await patchJson<Invoice>(
        `/api/invoices/${invoice.id}`,
        { status },
        t("status.updateInvoiceError"),
      );

      if (updatedInvoice.id !== invoice.id || updatedInvoice.status !== status) {
        throw new Error("The server returned an unexpected invoice response.");
      }

      onInvoiceUpdated(updatedInvoice);
      toast.success(status === "SENT" ? t("status.invoiceSent") : t("status.invoiceVoided"));
    } catch (error) {
      onInvoiceUpdated(invoice);
      toast.error(error instanceof Error ? error.message : t("status.updateInvoiceError"));
    } finally {
      setIsUpdating(false);
    }
  }

  if (!canSend && !canVoid) {
    return <span className="text-[12px] text-muted-foreground">—</span>;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={isUpdating}
              aria-label={t("common.actions")}
            />
          }
        >
          {isUpdating ? <LoaderCircle className="animate-spin" /> : <MoreHorizontal />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="crm-table-action-menu w-44">
          {canSend && (
            <DropdownMenuItem className="crm-table-action-item" onClick={() => void updateStatus("SENT")}>
              {t("status.sendInvoice")}
            </DropdownMenuItem>
          )}
          {canVoid && (
            <DropdownMenuItem className="crm-table-action-item" variant="destructive" onClick={() => setVoidOpen(true)}>
              {t("status.voidInvoice")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={voidOpen}
        onOpenChange={setVoidOpen}
        title={t("status.voidTitle")}
        description={t("status.voidDescription")}
        confirmLabel={t("status.voidInvoice")}
        onConfirm={() => updateStatus("VOIDED")}
      />
    </>
  );
}
