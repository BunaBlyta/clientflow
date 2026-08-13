import type { InvoiceStatus, Invoice, ProjectStatus, RequestStatus } from "@/lib/types";

export const PROJECT_STAGE_ORDER: ProjectStatus[] = [
  "DISCOVERY",
  "DESIGN",
  "DEVELOPMENT",
  "REVIEW",
  "LAUNCHED",
];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  PENDING: "Pending",
  DISCOVERY: "Discovery",
  DESIGN: "Design",
  DEVELOPMENT: "Development",
  REVIEW: "Review",
  LAUNCHED: "Launched",
  CANCELLED: "Cancelled",
  ON_HOLD: "On hold",
};

// Text color only — project stage is meant to read from position/label first,
// color is a light assist, not a badge (AGENTS.md section 5).
export const PROJECT_STATUS_TONE: Record<ProjectStatus, string> = {
  PENDING: "text-muted-foreground",
  DISCOVERY: "text-foreground",
  DESIGN: "text-foreground",
  DEVELOPMENT: "text-foreground",
  REVIEW: "text-foreground",
  LAUNCHED: "text-status-success",
  CANCELLED: "text-status-danger",
  ON_HOLD: "text-status-warning",
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  PENDING: "Pending",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAYMENT_PENDING: "Payment pending",
  PAID: "Paid",
  FAILED: "Failed",
  VOIDED: "Voided",
  REFUNDED: "Refunded",
};

export const INVOICE_STATUS_TONE: Record<InvoiceStatus, string> = {
  DRAFT: "text-muted-foreground",
  SENT: "text-foreground",
  PAYMENT_PENDING: "text-status-warning",
  PAID: "text-status-success",
  FAILED: "text-status-danger",
  VOIDED: "text-muted-foreground line-through decoration-1",
  REFUNDED: "text-muted-foreground",
};

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function isInvoiceOverdue(invoice: Invoice): boolean {
  if (!invoice.dueDate) return false;
  if (invoice.status !== "SENT" && invoice.status !== "PAYMENT_PENDING") return false;
  // dueDate is midnight on the day the invoice is due, so it isn't overdue
  // until that whole day has passed — an invoice due today is not yet late.
  return new Date(invoice.dueDate).getTime() + ONE_DAY_MS <= Date.now();
}

export function invoiceDisplayLabel(invoice: Invoice): string {
  return isInvoiceOverdue(invoice) ? "Overdue" : INVOICE_STATUS_LABEL[invoice.status];
}

export function invoiceDisplayLabelKey(invoice: Invoice): string {
  return isInvoiceOverdue(invoice) ? "status.invoice.OVERDUE" : `status.invoice.${invoice.status}`;
}

export function invoiceDisplayTone(invoice: Invoice): string {
  return isInvoiceOverdue(invoice) ? "text-status-danger" : INVOICE_STATUS_TONE[invoice.status];
}
