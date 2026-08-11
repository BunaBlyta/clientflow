export const INVOICE_STATUSES = [
  'DRAFT',
  'SENT',
  'PAYMENT_PENDING',
  'PAID',
  'FAILED',
  'VOIDED',
  'REFUNDED',
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

const ALLOWED_TRANSITIONS: Record<InvoiceStatus, readonly InvoiceStatus[]> = {
  DRAFT: ['SENT', 'VOIDED'],
  SENT: ['PAYMENT_PENDING', 'VOIDED'],
  PAYMENT_PENDING: ['PAID', 'FAILED', 'VOIDED'],
  PAID: ['REFUNDED'],
  FAILED: ['PAYMENT_PENDING', 'VOIDED'],
  VOIDED: [],
  REFUNDED: [],
};

export function canTransitionInvoiceStatus(
  from: InvoiceStatus,
  to: InvoiceStatus,
): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export function transitionInvoiceStatus(
  from: InvoiceStatus,
  to: InvoiceStatus,
): InvoiceStatus {
  if (!canTransitionInvoiceStatus(from, to)) {
    throw new Error(`Invoice cannot transition from ${from} to ${to}`);
  }

  return to;
}
