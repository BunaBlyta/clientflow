import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

function serializeNotification(notification: {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  readAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: notification.id,
    userId: notification.userId,
    type: notification.type,
    title: notification.title,
    body: notification.message,
    read: notification.readAt !== null,
    createdAt: notification.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const { id } = await params;
  const notification = await prisma.notification.findFirst({
    where: { id, userId: user.id },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      createdAt: true,
    },
  });

  if (!notification) {
    return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
  }

  const updatedNotification = notification.readAt
    ? notification
    : await prisma.notification.update({
        where: { id: notification.id },
        data: { readAt: new Date() },
        select: {
          id: true,
          userId: true,
          type: true,
          title: true,
          message: true,
          readAt: true,
          createdAt: true,
        },
      });

  return NextResponse.json(serializeNotification(updatedNotification));
}
