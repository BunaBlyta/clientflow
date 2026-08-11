import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(
    notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.message,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    })),
  );
}

