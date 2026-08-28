import { prisma } from '@/app/api/_lib/prisma';
import {
  createNotification,
  scheduleEntityChanged,
  scheduleNotificationEffects,
} from '@/app/api/_lib/notifications';

export type StripePaymentReferences = {
  checkoutSessionId?: string;
  paymentIntentId?: string;
};

export async function markInvoicePaid(
  invoiceId: string,
  references: StripePaymentReferences,
): Promise<boolean> {
  const result = await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.invoice.updateMany({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        ...(references.checkoutSessionId
          ? { stripeCheckoutSessionId: references.checkoutSessionId }
          : {}),
        ...(references.paymentIntentId
          ? { stripePaymentIntentId: references.paymentIntentId }
          : {}),
      },
    });
    if (claimed.count !== 1) return null;

    const invoice = await transaction.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, projectId: true, clientId: true, type: true, status: true },
    });
    if (!invoice) throw new Error('Claimed paid invoice not found');

    const project = await transaction.project.findUnique({
      where: { id: invoice.projectId },
      select: { status: true },
    });
    if ((invoice.type === 'DEPOSIT' || invoice.type === 'CUSTOM') && project?.status === 'PENDING') {
      await transaction.project.update({
        where: { id: invoice.projectId },
        data: { status: 'DISCOVERY' },
      });
      await transaction.note.create({
        data: {
          projectId: invoice.projectId,
          content: `${invoice.type === 'DEPOSIT' ? 'Deposit' : 'Custom invoice'} payment confirmed. Project moved to Discovery.`,
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

  if (!result) return false;
  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({
    entity: 'invoice',
    id: invoiceId,
    projectId: result.projectId,
    invoiceId,
    reason: 'payment',
  });
  scheduleEntityChanged({
    entity: 'project',
    id: result.projectId,
    projectId: result.projectId,
    invoiceId,
    reason: 'payment',
  });
  return true;
}

export async function markInvoiceFailed(
  invoiceId: string,
  references: Pick<StripePaymentReferences, 'paymentIntentId'> = {},
): Promise<boolean> {
  const result = await prisma.$transaction(async (transaction) => {
    const claimed = await transaction.invoice.updateMany({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: {
        status: 'FAILED',
        ...(references.paymentIntentId
          ? { stripePaymentIntentId: references.paymentIntentId }
          : {}),
      },
    });
    if (claimed.count !== 1) return null;

    const invoice = await transaction.invoice.findUnique({
      where: { id: invoiceId },
      select: { id: true, clientId: true, projectId: true },
    });
    if (!invoice) throw new Error('Claimed failed invoice not found');

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

  if (!result) return false;
  scheduleNotificationEffects(result.notificationIds);
  scheduleEntityChanged({
    entity: 'invoice',
    id: invoiceId,
    projectId: result.projectId,
    invoiceId,
    reason: 'payment',
  });
  return true;
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
  const client = await transaction.client.findUnique({
    where: { id: clientId },
    select: { userId: true },
  });
  if (!client) throw new Error('Invoice client not found');
  return client.userId;
}
