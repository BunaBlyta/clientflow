import { NextRequest, NextResponse } from 'next/server';
import { verifyStripeSignature } from '@/app/api/_lib/stripe';
import { prisma } from '@/app/api/_lib/prisma';
import { createNotification, scheduleEntityChanged, scheduleNotificationEffects } from '@/app/api/_lib/notifications';

export const runtime = 'nodejs';

type StripeEvent = {
  type?: string;
  data?: { object?: {
    id?: string;
    metadata?: { invoiceId?: string; projectId?: string };
    payment_intent?: string | null;
    payment_status?: 'paid' | 'unpaid' | 'no_payment_required' | null;
  } };
};

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get('stripe-signature');
  if (!secret || !signature) {
    return NextResponse.json({ error: 'Stripe signature required' }, { status: 400 });
  }

  const payload = await request.text();
  if (!verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 });
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(payload) as StripeEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
  }

  const stripeObject = event.data?.object;
  const invoiceId = stripeObject?.metadata?.invoiceId;
  if (!invoiceId) return NextResponse.json({ received: true });

  const checkoutCompletedWithFunds =
    event.type === 'checkout.session.completed' && stripeObject?.payment_status === 'paid';
  if (
    checkoutCompletedWithFunds ||
    event.type === 'checkout.session.async_payment_succeeded' ||
    event.type === 'payment_intent.succeeded'
  ) {
    await markInvoicePaid(invoiceId, stripeObject);
  } else if (
    event.type === 'payment_intent.payment_failed' ||
    event.type === 'checkout.session.async_payment_failed' ||
    event.type === 'checkout.session.expired'
  ) {
    await markInvoiceFailed(invoiceId, stripeObject);
  }

  return NextResponse.json({ received: true });
}

async function markInvoicePaid(
  invoiceId: string,
  stripeObject: NonNullable<StripeEvent['data']>['object'],
) {
  const result = await prisma.$transaction(async (transaction) => {
    const result = await transaction.invoice.updateMany({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        stripeCheckoutSessionId: stripeObject?.id,
        stripePaymentIntentId: stripeObject?.payment_intent,
      },
    });
    if (result.count !== 1) return;

    const invoice = await transaction.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, projectId: true, clientId: true, type: true, status: true },
    });
    if (!invoice) return;

    const project = await transaction.project.findUnique({
      where: { id: invoice.projectId },
      select: { status: true },
    });
    if (invoice.type === 'DEPOSIT' && project?.status === 'PENDING') {
      await transaction.project.update({
        where: { id: invoice.projectId },
        data: { status: 'DISCOVERY' },
      });
      await transaction.note.create({
        data: {
          projectId: invoice.projectId,
          content: 'Deposit payment confirmed. Project moved to Discovery.',
          isSystem: true,
        },
      });
    }

    const notificationIds: string[] = [];
    const clientNotificationId = await createNotification(transaction, {
      userId: await clientUserId(transaction, invoice.clientId),
      type: 'PAYMENT_SUCCEEDED',
      invoiceId: invoice.id,
      projectId: invoice.projectId,
      title: 'Payment received',
      message: 'Your invoice payment was confirmed.',
    });
    if (clientNotificationId) notificationIds.push(clientNotificationId);

    const staffUsers = await activeStaffUsers(transaction);
    for (const staffUser of staffUsers) {
      const staffNotificationId = await createNotification(transaction, {
        userId: staffUser.id,
        type: 'PAYMENT_SUCCEEDED',
        invoiceId: invoice.id,
        projectId: invoice.projectId,
        title: 'Payment received',
        message: 'A client invoice payment was confirmed.',
      });
      if (staffNotificationId) notificationIds.push(staffNotificationId);
    }
    return { notificationIds, projectId: invoice.projectId };
  });
  if (!result) return;
  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: invoiceId, projectId: result.projectId, invoiceId, reason: 'payment' });
  scheduleEntityChanged({ entity: 'project', id: result.projectId, projectId: result.projectId, invoiceId, reason: 'payment' });
}

async function markInvoiceFailed(
  invoiceId: string,
  stripeObject: NonNullable<StripeEvent['data']>['object'],
) {
  const result = await prisma.$transaction(async (transaction) => {
    const result = await transaction.invoice.updateMany({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: { status: 'FAILED', stripePaymentIntentId: stripeObject?.payment_intent },
    });
    if (result.count !== 1) return;

    const invoice = await transaction.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, clientId: true, projectId: true },
    });
    if (!invoice) return;

    const notificationIds: string[] = [];
    const clientNotificationId = await createNotification(transaction, {
      userId: await clientUserId(transaction, invoice.clientId),
      type: 'PAYMENT_FAILED',
      invoiceId,
      projectId: invoice.projectId,
      title: 'Payment failed',
      message: 'Your invoice payment could not be completed.',
    });
    if (clientNotificationId) notificationIds.push(clientNotificationId);
    const staffUsers = await activeStaffUsers(transaction);
    for (const staffUser of staffUsers) {
      const staffNotificationId = await createNotification(transaction, {
        userId: staffUser.id,
        type: 'PAYMENT_FAILED',
        invoiceId,
        projectId: invoice.projectId,
        title: 'Payment failed',
        message: 'A client invoice payment could not be completed.',
      });
      if (staffNotificationId) notificationIds.push(staffNotificationId);
    }
    return { notificationIds, projectId: invoice.projectId };
  });
  if (!result) return;
  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({ entity: 'invoice', id: invoiceId, projectId: result.projectId, invoiceId, reason: 'payment' });
}

async function activeStaffUsers(transaction: {
  user?: { findMany(args: unknown): Promise<Array<{ id: string }>> };
}) {
  if (!transaction.user) return [];
  return transaction.user.findMany({
    where: { role: 'STAFF', isActive: true },
    select: { id: true },
  });
}

async function clientUserId(
  transaction: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  clientId: string,
) {
  const client = await transaction.client.findUnique({ where: { id: clientId }, select: { userId: true } });
  if (!client) throw new Error('Invoice client not found');
  return client.userId;
}
