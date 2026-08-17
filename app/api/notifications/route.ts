import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const sinceValue = new URL(request.url).searchParams.get('since');
  const since = sinceValue ? new Date(sinceValue) : null;
  const notifications = await prisma.notification.findMany({
    where: {
      userId: user.id,
      ...(since && !Number.isNaN(since.getTime()) ? { createdAt: { gt: since } } : {}),
    },
    select: {
      id: true,
      userId: true,
      type: true,
      title: true,
      message: true,
      readAt: true,
      createdAt: true,
      projectId: true,
      invoiceId: true,
      requestId: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });

  return NextResponse.json(
    notifications.map((notification) => ({
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      body: notification.message,
      projectId: notification.projectId,
      invoiceId: notification.invoiceId,
      requestId: notification.requestId,
      read: notification.readAt !== null,
      createdAt: notification.createdAt.toISOString(),
    })),
  );
}
