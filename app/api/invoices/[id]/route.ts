import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { markInvoiceFailed, markInvoicePaid } from '@/app/api/_lib/invoice-payments';
import { prisma } from '@/app/api/_lib/prisma';
import {
  expireCheckoutSession,
  paymentIntentId,
  retrieveCheckoutSession,
} from '@/app/api/_lib/stripe-checkout';
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
  stripeCheckoutAttemptId: true,
  stripeCheckoutSessionId: true,
  stripePaymentIntentId: true,
} as const;

type ReconciliationInvoice = Parameters<typeof serializeInvoice>[0] & {
  stripeCheckoutAttemptId: string | null;
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

  const retrieved = await retrieveCheckoutSession(
    invoice.stripeCheckoutSessionId,
    secretKey,
    { expandPaymentIntent: true },
  );
  if (!retrieved.ok) return invoice;

  const session = retrieved.value;
  const paymentIntent = typeof session.payment_intent === 'object'
    ? session.payment_intent
    : null;
  if (session.payment_status === 'paid') {
    await markInvoicePaid(invoice.id, {
      checkoutSessionId: session.id ?? invoice.stripeCheckoutSessionId,
      paymentIntentId: paymentIntentId(session),
    });
    return (await prisma.invoice.findUnique({ where: { id: invoice.id }, select: invoiceSelect })) ?? invoice;
  }

  const paymentIntentFailed =
    paymentIntent?.status === 'requires_payment_method' ||
    paymentIntent?.status === 'canceled';
  const checkoutExpired = session.status === 'expired';

  if (!checkoutExpired && !paymentIntentFailed) return invoice;

  await markInvoiceFailed(invoice.id, { paymentIntentId: paymentIntentId(session) });
  return (await prisma.invoice.findUnique({ where: { id: invoice.id }, select: invoiceSelect })) ?? invoice;
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

  if (nextStatus === 'VOIDED' && invoice.status === 'PAYMENT_PENDING') {
    const safeToVoid = await closeCheckoutBeforeVoid(invoice);
    if (safeToVoid) return safeToVoid;
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

async function closeCheckoutBeforeVoid(invoice: ReconciliationInvoice): Promise<NextResponse | null> {
  if (!invoice.stripeCheckoutSessionId) {
    return NextResponse.json(
      { error: 'Invoice checkout is still being prepared; try again' },
      { status: 409 },
    );
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 503 });
  }

  const retrieved = await retrieveCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
  if (!retrieved.ok) {
    return NextResponse.json(
      { error: 'Unable to verify the active Stripe checkout session' },
      { status: 502 },
    );
  }

  const session = retrieved.value;
  if (session.payment_status === 'paid') {
    await markInvoicePaid(invoice.id, {
      checkoutSessionId: session.id ?? invoice.stripeCheckoutSessionId,
      paymentIntentId: paymentIntentId(session),
    });
    return NextResponse.json({ error: 'A paid invoice cannot be voided' }, { status: 409 });
  }

  if (session.status === 'complete') {
    return NextResponse.json(
      { error: 'Payment is still processing; the invoice cannot be voided yet' },
      { status: 409 },
    );
  }

  if (session.status === 'open') {
    const expired = await expireCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
    if (!expired.ok) {
      const latest = await retrieveCheckoutSession(invoice.stripeCheckoutSessionId, secretKey);
      if (latest.ok && latest.value.payment_status === 'paid') {
        await markInvoicePaid(invoice.id, {
          checkoutSessionId: latest.value.id ?? invoice.stripeCheckoutSessionId,
          paymentIntentId: paymentIntentId(latest.value),
        });
        return NextResponse.json({ error: 'A paid invoice cannot be voided' }, { status: 409 });
      }
      return NextResponse.json(
        { error: 'Unable to close the active Stripe checkout session' },
        { status: 502 },
      );
    }
    return null;
  }

  if (session.status === 'expired') return null;
  return NextResponse.json(
    { error: 'Stripe returned an unknown checkout session state' },
    { status: 502 },
  );
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
