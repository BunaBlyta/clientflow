import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from '@/app/api/invoices/serialize';
import { INVOICE_STATUSES, transitionInvoiceStatus, type InvoiceStatus } from '@/prisma/invoice-state';

export const runtime = 'nodejs';

const invoiceSelect = {
  id: true,
  projectId: true,
  clientId: true,
  type: true,
  description: true,
  amount: true,
  status: true,
  dueDate: true,
  paidAt: true,
  createdAt: true,
} as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findFirst({
    where: {
      id,
      ...(user.role === 'CLIENT' ? { client: { userId: user.id } } : {}),
    },
    select: {
      id: true,
      projectId: true,
      clientId: true,
      type: true,
      description: true,
      amount: true,
      status: true,
      dueDate: true,
      paidAt: true,
      createdAt: true,
    },
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  return NextResponse.json(serializeInvoice(invoice));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  if (user.role !== 'STAFF') {
    return NextResponse.json({ error: 'Staff access required' }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const status = (body as { status?: unknown })?.status;
  if (typeof status !== 'string' || !(INVOICE_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ error: 'A valid invoice status is required' }, { status: 400 });
  }

  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({ where: { id }, select: invoiceSelect });
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const nextStatus = status as InvoiceStatus;
  if (nextStatus === 'PAID' || nextStatus === 'REFUNDED') {
    return NextResponse.json(
      { error: `Invoice cannot transition from ${invoice.status} to ${nextStatus} through this endpoint` },
      { status: 409 },
    );
  }

  try {
    transitionInvoiceStatus(invoice.status, nextStatus);
  } catch {
    return NextResponse.json(
      { error: `Invoice cannot transition from ${invoice.status} to ${nextStatus}` },
      { status: 409 },
    );
  }

  const updatedInvoice = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.invoice.update({
      where: { id },
      data: { status: nextStatus },
      select: invoiceSelect,
    });

    if (nextStatus === 'SENT' && invoice.status !== 'SENT') {
      const client = await transaction.client.findUnique({
        where: { id: invoice.clientId },
        select: { userId: true },
      });

      if (client) {
        await transaction.notification.create({
          data: {
            userId: client.userId,
            type: 'INVOICE_ISSUED',
            title: 'Invoice sent',
            message: invoice.description
              ? `${invoice.description} is ready to review and pay.`
              : 'A new invoice is ready to review and pay.',
          },
        });
      }
    }

    return updated;
  });

  return NextResponse.json(serializeInvoice(updatedInvoice));
}
