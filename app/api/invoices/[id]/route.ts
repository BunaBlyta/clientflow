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
  issuedAt: true,
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

class ConcurrentInvoiceUpdate extends Error {
  constructor() {
    super('Invoice was updated by another request');
  }
}

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

  const result = await prisma.$transaction(async (transaction) => {
    const updated = await transaction.invoice.updateMany({
      where: { id: invoice.id, status: 'PAYMENT_PENDING' },
      data: {
        status: 'FAILED',
        ...(paymentIntent?.id ? { stripePaymentIntentId: paymentIntent.id } : {}),
      },
    });
    if (updated.count !== 1) return null;

    const failedInvoice = await transaction.invoice.findUnique({
      where: { id: invoice.id },
      select: invoiceSelect,
    });
    if (!failedInvoice) return null;

    const notificationIds: string[] = [];
    const client = await transaction.client.findUnique({
      where: { id: failedInvoice.clientId },
      select: { userId: true },
    });
    if (client) {
      const notificationId = await createNotification(transaction, {
        userId: client.userId,
        type: 'PAYMENT_FAILED',
        invoiceId: failedInvoice.id,
        projectId: failedInvoice.projectId,
        title: 'Payment failed',
        message: 'Your invoice payment could not be completed.',
      });
      if (notificationId) notificationIds.push(notificationId);
    }
    const staffUsers = await transaction.user.findMany({
      where: { role: 'STAFF', isActive: true },
      select: { id: true },
    });
    for (const staffUser of staffUsers) {
      const notificationId = await createNotification(transaction, {
        userId: staffUser.id,
        type: 'PAYMENT_FAILED',
        invoiceId: failedInvoice.id,
        projectId: failedInvoice.projectId,
        title: 'Payment failed',
        message: 'A client invoice payment could not be completed.',
      });
      if (notificationId) notificationIds.push(notificationId);
    }
    return { invoice: failedInvoice, notificationIds };
  });
  if (!result) return invoice;
  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: invoice.id, projectId: invoice.projectId, invoiceId: invoice.id, reason: 'payment' });
  return result.invoice;
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

  let result: Awaited<ReturnType<typeof updateInvoice>>;
  try {
    result = await updateInvoice(id, invoice, nextStatus);
  } catch (error) {
    if (error instanceof ConcurrentInvoiceUpdate) {
      return NextResponse.json({ error: `Invoice cannot transition from ${invoice.status} to ${nextStatus}` }, { status: 409 });
    }
    throw error;
  }

  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: result.updated.id, projectId: result.updated.projectId, invoiceId: result.updated.id });

  return NextResponse.json(serializeInvoice(result.updated));
}

async function updateInvoice(id: string, invoice: ReconciliationInvoice, nextStatus: InvoiceStatus) {
  return prisma.$transaction(async (transaction) => {
    const claim = await transaction.invoice.updateMany({
      where: { id, status: invoice.status },
      data: {
        status: nextStatus,
        ...(nextStatus === 'SENT' && !invoice.issuedAt ? { issuedAt: new Date() } : {}),
      },
    });
    if (claim.count !== 1) throw new ConcurrentInvoiceUpdate();
    const updated = await transaction.invoice.findUnique({
      where: { id },
      select: invoiceSelect,
    });
    if (!updated) throw new ConcurrentInvoiceUpdate();

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
}
