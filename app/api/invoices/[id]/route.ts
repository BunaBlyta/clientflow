import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { serializeInvoice } from '@/app/api/invoices/serialize';
import { INVOICE_STATUSES, transitionInvoiceStatus, type InvoiceStatus } from '@/prisma/invoice-state';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';

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
  stripeCheckoutSessionId: true,
  stripePaymentIntentId: true,
} as const;

type StripePaymentIntent = {
  id?: string;
  status?: string;
};

type StripeCheckoutSession = {
  status?: 'open' | 'complete' | 'expired' | null;
  payment_status?: 'paid' | 'unpaid' | 'no_payment_required' | null;
  payment_intent?: string | StripePaymentIntent | null;
};

type ReconciliationInvoice = Parameters<typeof serializeInvoice>[0] & {
  stripeCheckoutSessionId: string | null;
  stripePaymentIntentId: string | null;
};

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
    select: invoiceSelect,
  });

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  }

  const shouldReconcilePayment =
    request.nextUrl.searchParams.get('reconcilePayment') === 'true';
  const reconciledInvoice = shouldReconcilePayment
    ? await reconcilePendingPayment(invoice)
    : invoice;

  return NextResponse.json(serializeInvoice(reconciledInvoice));
}

async function reconcilePendingPayment(invoice: ReconciliationInvoice) {
  if (invoice.status !== 'PAYMENT_PENDING' || !invoice.stripeCheckoutSessionId) {
    return invoice;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return invoice;

  const sessionUrl = new URL(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(invoice.stripeCheckoutSessionId)}`,
  );
  sessionUrl.searchParams.set('expand[]', 'payment_intent');

  let session: StripeCheckoutSession;
  try {
    const response = await fetch(sessionUrl, {
      headers: { Authorization: `Bearer ${secretKey}` },
    });
    if (!response.ok) return invoice;
    session = (await response.json()) as StripeCheckoutSession;
  } catch {
    return invoice;
  }

  const paymentIntent =
    session.payment_intent && typeof session.payment_intent === 'object'
      ? session.payment_intent
      : null;
  const paymentIntentFailed =
    paymentIntent?.status === 'requires_payment_method' ||
    paymentIntent?.status === 'canceled';
  const checkoutExpired = session.status === 'expired';

  if (!checkoutExpired && !paymentIntentFailed) return invoice;

  const updated = await prisma.invoice.updateMany({
    where: { id: invoice.id, status: 'PAYMENT_PENDING' },
    data: {
      status: 'FAILED',
      ...(paymentIntent?.id ? { stripePaymentIntentId: paymentIntent.id } : {}),
    },
  });
  if (updated.count !== 1) return invoice;

  const clientLookup = (prisma as unknown as {
    client?: { findUnique(args: unknown): Promise<{ userId: string } | null> };
    notification?: { create(args: unknown): Promise<{ id?: string }> };
  });
  const client = await clientLookup.client?.findUnique({
    where: { id: invoice.clientId },
    select: { userId: true },
  });
  const notificationIds: string[] = [];
  if (client && clientLookup.notification) {
    const notification = await clientLookup.notification.create({
      data: {
        userId: client.userId,
        type: 'PAYMENT_FAILED',
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        title: 'Payment failed',
        message: 'Your invoice payment could not be completed.',
      },
    });
    if (notification?.id) notificationIds.push(notification.id);
  }
  scheduleNotificationEffects(notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: invoice.id, projectId: invoice.projectId, invoiceId: invoice.id });

  return (await prisma.invoice.findUnique({
    where: { id: invoice.id },
    select: invoiceSelect,
  })) ?? invoice;
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

  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.invoice.update({
      where: { id },
      data: { status: nextStatus },
      select: invoiceSelect,
    });

    const notificationIds: string[] = [];
    if (nextStatus === 'SENT' && invoice.status !== 'SENT') {
      const client = await transaction.client.findUnique({
        where: { id: invoice.clientId },
        select: { userId: true },
      });

      if (client) {
        const id = await createNotification(transaction, {
          userId: client.userId,
          type: invoice.type === 'EXTRA' ? 'EXTRA_CHARGE_CREATED' : 'INVOICE_ISSUED',
          invoiceId: updated.id,
          projectId: updated.projectId,
          title: invoice.type === 'EXTRA' ? 'Additional invoice sent' : 'Invoice sent',
          message: invoice.description
            ? `${invoice.description} is ready to review and pay.`
            : 'A new invoice is ready to review and pay.',
        });
        if (id) notificationIds.push(id);
      }
    }

    return { updated, notificationIds };
  });

  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: result.updated.id, projectId: result.updated.projectId, invoiceId: result.updated.id });

  return NextResponse.json(serializeInvoice(result.updated));
}
