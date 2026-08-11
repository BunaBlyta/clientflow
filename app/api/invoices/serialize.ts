type InvoiceRecord = {
  id: string;
  projectId: string;
  clientId: string;
  type: 'DEPOSIT' | 'FINAL' | 'EXTRA' | 'CUSTOM';
  description: string | null;
  amount: number | string | { toString(): string };
  status: 'DRAFT' | 'SENT' | 'PAYMENT_PENDING' | 'PAID' | 'FAILED' | 'VOIDED' | 'REFUNDED';
  dueDate: Date | null;
  paidAt: Date | null;
  createdAt: Date;
};

const FALLBACK_LABELS: Record<InvoiceRecord['type'], string> = {
  DEPOSIT: 'Deposit invoice',
  FINAL: 'Final payment',
  EXTRA: 'Extra charge',
  CUSTOM: 'Custom invoice',
};

export function serializeInvoice(invoice: InvoiceRecord) {
  return {
    id: invoice.id,
    projectId: invoice.projectId,
    clientId: invoice.clientId,
    kind: invoice.type,
    label: invoice.description ?? FALLBACK_LABELS[invoice.type],
    amountCents: Math.round(Number(invoice.amount) * 100),
    status: invoice.status,
    ...(invoice.dueDate ? { dueDate: invoice.dueDate.toISOString() } : {}),
    ...(invoice.paidAt ? { paidAt: invoice.paidAt.toISOString() } : {}),
    createdAt: invoice.createdAt.toISOString(),
  };
}
