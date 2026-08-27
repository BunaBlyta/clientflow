import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';
import { notificationSelect, serializeNotification } from '../_lib';

export const runtime = 'nodejs';

function invalidRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

async function readPatchBody(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody.trim()) return {};

  let body: unknown;
  try {
    body = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  return body as Record<string, unknown>;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const body = await readPatchBody(request);
  if (body === null) return invalidRequest('Request body must be a JSON object');

  const hasArchiveChange = Object.prototype.hasOwnProperty.call(body, 'archived');
  if (hasArchiveChange && typeof body.archived !== 'boolean') {
    return invalidRequest('archived must be a boolean');
  }

  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
    select: notificationSelect,
  });

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const archiveRequested = body.archived as boolean | undefined;
  const needsArchiveUpdate = hasArchiveChange && archiveRequested !== (notification.archivedAt != null);
  const needsReadUpdate = !hasArchiveChange && notification.readAt === null;

  const updatedNotification = needsArchiveUpdate || needsReadUpdate
    ? await prisma.notification.update({
        where: { id: notification.id },
        data: hasArchiveChange
          ? { archivedAt: archiveRequested ? new Date() : null }
          : { readAt: new Date() },
        select: notificationSelect,
      })
    : notification;

  return NextResponse.json(serializeNotification(updatedNotification));
}
