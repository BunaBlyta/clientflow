import { after } from 'next/server';
import Ably from 'ably';
import { prisma } from './prisma';

export type NotificationInput = {
  userId: string;
  type:
    | 'REQUEST_SUBMITTED'
    | 'REQUEST_APPROVED'
    | 'REQUEST_REJECTED'
    | 'INVOICE_ISSUED'
    | 'PAYMENT_SUCCEEDED'
    | 'PAYMENT_FAILED'
    | 'PROJECT_STAGE_CHANGED'
    | 'NEW_NOTE'
    | 'EXTRA_CHARGE_CREATED';
  title: string;
  message: string;
  projectId?: string;
  invoiceId?: string;
  requestId?: string;
};

type NotificationWriteClient = {
  notification: {
    create(args: { data: NotificationInput }): Promise<{ id?: string }>;
  };
  pushDevice?: {
    findMany(args: unknown): Promise<Array<{ id: string }>>;
  };
  pushDelivery?: {
    createMany(args: unknown): Promise<unknown>;
  };
};

export type EntityChanged = {
  entity: 'invoice' | 'project' | 'note' | 'notification' | 'request';
  id: string;
  projectId?: string;
  invoiceId?: string;
  reason?: 'payment' | 'status' | 'note' | 'invoice';
};

/**
 * Creates the durable inbox row and, when the generated Prisma client has the
 * push models, its per-device outbox rows in the same transaction.
 *
 * The optional checks keep old route unit tests useful while the schema client
 * is being regenerated. Production always has both models.
 */
export async function createNotification(
  transaction: NotificationWriteClient,
  input: NotificationInput,
): Promise<string | null> {
  const notification = await transaction.notification.create({ data: input });
  if (!notification?.id || !transaction.pushDevice || !transaction.pushDelivery) {
    return notification?.id ?? null;
  }

  const devices = await transaction.pushDevice.findMany({
    where: { userId: input.userId, isActive: true },
    select: { id: true },
  });
  if (devices.length > 0) {
    await transaction.pushDelivery.createMany({
      data: devices.map((device) => ({
        notificationId: notification.id,
        deviceId: device.id,
      })),
      skipDuplicates: true,
    });
  }

  return notification.id;
}

export async function createNotifications(
  transaction: NotificationWriteClient,
  inputs: NotificationInput[],
): Promise<string[]> {
  const ids: string[] = [];
  for (const input of inputs) {
    const id = await createNotification(transaction, input);
    if (id) ids.push(id);
  }
  return ids;
}

export function scheduleNotificationEffects(notificationIds: string[]) {
  if (notificationIds.length === 0) return;
  scheduleAfter(async () => {
    try {
      await publishNotificationCreated(notificationIds);
      await dispatchPendingPushes();
    } catch (error) {
      console.error('Notification delivery failed after response', error);
    }
  });
}

export function scheduleEntityChanged(entity: EntityChanged) {
  scheduleAfter(async () => {
    try {
      await publishEntityChanged(entity);
    } catch (error) {
      console.error('Realtime entity invalidation failed after response', error);
    }
  });
}

function scheduleAfter(task: () => void | Promise<void>) {
  try {
    after(task);
  } catch (error) {
    // Route handlers run inside a request scope in Next. Direct route-unit
    // tests do not, so avoid starting provider work from those tests.
    if (process.env.NODE_ENV !== 'test') {
      void task();
    } else if (!(error instanceof Error) || !error.message.includes('outside a request scope')) {
      throw error;
    }
  }
}

function ablyClient() {
  const key = process.env.ABLY_API_KEY;
  return key ? new Ably.Rest(key) : null;
}

export function userChannel(userId: string) {
  return `clientflow:user:${userId}`;
}

export const staffChannel = 'clientflow:staff';

export async function createAblyTokenRequest(userId: string, isStaff: boolean) {
  const client = ablyClient();
  if (!client) throw new Error('ABLY_API_KEY is not configured');

  const capability: Record<string, ['subscribe']> = {
    [userChannel(userId)]: ['subscribe'],
  };
  if (isStaff) capability[staffChannel] = ['subscribe'];

  return client.auth.createTokenRequest({
    clientId: userId,
    ttl: 5 * 60 * 1000,
    capability,
  });
}

async function publishNotificationCreated(notificationIds: string[]) {
  const client = ablyClient();
  if (!client) return;

  const notifications = await prisma.notification.findMany({
    where: { id: { in: notificationIds } },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      projectId: true,
      invoiceId: true,
      requestId: true,
      createdAt: true,
    },
  });

  await Promise.all(notifications.map((notification) =>
    client.channels.get(userChannel(notification.userId)).publish('notification.created', {
      notificationId: notification.id,
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.message,
      read: notification.readAt !== null,
      projectId: notification.projectId,
      invoiceId: notification.invoiceId,
      requestId: notification.requestId,
      createdAt: notification.createdAt.toISOString(),
    }),
  ));
}

async function publishEntityChanged(entity: EntityChanged) {
  const client = ablyClient();
  if (!client) return;
  await client.channels.get(staffChannel).publish('entity.changed', {
    entity: entity.entity,
    id: entity.id,
    projectId: entity.projectId ?? null,
    invoiceId: entity.invoiceId ?? null,
    reason: entity.reason ?? (entity.entity === 'note' ? 'note' : entity.entity === 'project' ? 'status' : 'invoice'),
  });
}

const pushCopy: Record<NotificationInput['type'], { title: string; body: string }> = {
  REQUEST_SUBMITTED: { title: 'New project request', body: 'A new project request needs your review.' },
  REQUEST_APPROVED: { title: 'Project request approved', body: 'Your project request was approved.' },
  REQUEST_REJECTED: { title: 'Project request update', body: 'There is an update to your project request.' },
  INVOICE_ISSUED: { title: 'Invoice ready', body: 'A new invoice is ready to review.' },
  PAYMENT_SUCCEEDED: { title: 'Payment received', body: 'Your payment was confirmed.' },
  PAYMENT_FAILED: { title: 'Payment update', body: 'Your payment could not be completed.' },
  PROJECT_STAGE_CHANGED: { title: 'Project status updated', body: 'Your project status has changed.' },
  NEW_NOTE: { title: 'New project note', body: 'A new note was posted to your project.' },
  EXTRA_CHARGE_CREATED: { title: 'Additional invoice ready', body: 'An additional invoice is ready to review.' },
};

type PendingDelivery = {
  id: string;
  attempts: number;
  device: { id: string; token: string };
  notification: {
    id: string;
    userId: string;
    type: NotificationInput['type'];
    projectId: string | null;
    invoiceId: string | null;
    requestId: string | null;
  };
};

export async function dispatchPendingPushes() {
  const outstanding = await prisma.pushDelivery.findMany({
    where: { status: 'SENT', expoTicketId: { not: null }, expoReceiptStatus: null },
    select: { expoTicketId: true },
    take: 100,
  });
  const outstandingTicketIds = outstanding
    .map((delivery) => delivery.expoTicketId)
    .filter((ticketId): ticketId is string => Boolean(ticketId));
  if (outstandingTicketIds.length > 0) {
    await processExpoReceipts(outstandingTicketIds);
  }
  while (await dispatchPendingPushBatch()) {
    // Drain every due batch, including deliveries created by earlier writes.
  }
}

async function dispatchPendingPushBatch() {
  const apiKey = process.env.EXPO_ACCESS_TOKEN;
  const candidates = await prisma.pushDelivery.findMany({
    where: {
      status: 'PENDING',
      device: { isActive: true },
      OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
    },
    include: {
      device: { select: { id: true, token: true } },
      notification: {
        select: {
          id: true,
          userId: true,
          type: true,
          projectId: true,
          invoiceId: true,
          requestId: true,
        },
      },
    },
    take: 100,
  }) as PendingDelivery[];
  if (candidates.length === 0) return false;

  // Claim each row briefly before making the provider call. This prevents two
  // concurrent web requests (or a retry worker) from sending the same alert.
  const claimUntil = new Date(Date.now() + 5 * 60_000);
  const deliveries: PendingDelivery[] = [];
  for (const candidate of candidates) {
    const claim = await prisma.pushDelivery.updateMany({
      where: {
        id: candidate.id,
        status: 'PENDING',
        OR: [{ nextAttemptAt: null }, { nextAttemptAt: { lte: new Date() } }],
      },
      data: { nextAttemptAt: claimUntil, attempts: { increment: 1 } },
    });
    if (claim.count === 1) deliveries.push({ ...candidate, attempts: candidate.attempts + 1 });
  }
  if (deliveries.length === 0) return false;

  let response: Response;
  try {
    response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify(deliveries.map((delivery) => {
        const copy = pushCopy[delivery.notification.type];
        return {
          to: delivery.device.token,
          title: copy.title,
          body: copy.body,
          sound: 'default',
          data: {
            notificationId: delivery.notification.id,
            type: delivery.notification.type,
            projectId: delivery.notification.projectId,
            invoiceId: delivery.notification.invoiceId,
            requestId: delivery.notification.requestId,
          },
        };
      })),
    });
  } catch {
    await rescheduleClaimedDeliveries(deliveries, 'Expo request failed');
    return true;
  }

  if (!response.ok) {
    await rescheduleClaimedDeliveries(deliveries, `Expo returned ${response.status}`);
    return true;
  }

  let result: { data?: Array<{ status?: string; id?: string; message?: string; details?: { error?: string } }> };
  try {
    result = await response.json() as typeof result;
  } catch {
    await rescheduleClaimedDeliveries(deliveries, 'Expo returned invalid JSON');
    return true;
  }
  const tickets = result.data ?? [];
  const ticketIds: string[] = [];
  await Promise.all(deliveries.map((delivery, index) => {
    const ticket = tickets[index];
    if (!ticket) {
      return prisma.pushDelivery.update({
        where: { id: delivery.id },
        data: {
          status: delivery.attempts >= 5 ? 'FAILED' : 'PENDING',
          lastError: 'Expo returned no ticket for delivery',
          nextAttemptAt: delivery.attempts >= 5 ? null : new Date(Date.now() + 60_000),
        },
      });
    }
    if (ticket?.id) ticketIds.push(ticket.id);
    const isUnregistered = ticket?.details?.error === 'DeviceNotRegistered';
    return prisma.pushDelivery.update({
      where: { id: delivery.id },
      data: {
        status: ticket?.status === 'error' ? 'FAILED' : 'SENT',
        expoTicketId: ticket?.id,
        expoReceiptStatus: null,
        lastError: ticket?.message,
        sentAt: ticket?.status === 'ok' ? new Date() : undefined,
      },
    }).then(async () => {
      if (isUnregistered) {
        await prisma.pushDevice.update({
          where: { id: delivery.device.id },
          data: { isActive: false },
        });
      }
    });
  }));
  if (ticketIds.length > 0) await processExpoReceipts(ticketIds);
  return true;
}

async function rescheduleClaimedDeliveries(deliveries: PendingDelivery[], error: string) {
  await Promise.all(deliveries.map((delivery) => {
    const exhausted = delivery.attempts >= 5;
    return prisma.pushDelivery.update({
      where: { id: delivery.id },
      data: {
        status: exhausted ? 'FAILED' : 'PENDING',
        lastError: error,
        nextAttemptAt: exhausted ? null : new Date(Date.now() + Math.min(15 * 60_000, 2 ** delivery.attempts * 15_000)),
      },
    });
  }));
}

export async function processExpoReceipts(ticketIds: string[]) {
  const apiKey = process.env.EXPO_ACCESS_TOKEN;
  if (ticketIds.length === 0) return;
  let response: Response;
  try {
    response = await fetch('https://exp.host/--/api/v2/push/getReceipts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body: JSON.stringify({ ids: ticketIds }),
    });
  } catch {
    return;
  }
  if (!response.ok) return;
  let payload: {
    data?: Record<string, { status?: string; message?: string; details?: { error?: string } }>;
  };
  try {
    payload = await response.json() as typeof payload;
  } catch {
    return;
  }
  for (const [ticketId, receipt] of Object.entries(payload.data ?? {})) {
    if (receipt.status !== 'ok' && receipt.status !== 'error') continue;
    const isUnregistered = receipt.details?.error === 'DeviceNotRegistered';
    const delivery = await prisma.pushDelivery.findFirst({ where: { expoTicketId: ticketId } });
    if (!delivery) continue;
    await prisma.pushDelivery.update({
      where: { id: delivery.id },
      data: {
        expoReceiptStatus: receipt.status,
        ...(receipt.status === 'error' ? { status: 'FAILED' as const } : {}),
        lastError: receipt.message,
      },
    });
    if (isUnregistered) {
      await prisma.pushDevice.update({ where: { id: delivery.deviceId }, data: { isActive: false } });
    }
  }
}
