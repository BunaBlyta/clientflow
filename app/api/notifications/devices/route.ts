import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { prisma } from '@/app/api/_lib/prisma';

export const runtime = 'nodejs';

function readToken(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const token = (body as { token?: unknown }).token;
  if (typeof token !== 'string') return null;
  const value = token.trim();
  return value.length >= 10 && value.length <= 512 ? value : null;
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }
  const token = readToken(body);
  if (!token || !/^Expo(?:nent)?PushToken\[[^\]]+\]$/.test(token)) {
    return NextResponse.json({ error: 'A valid Expo push token is required' }, { status: 400 });
  }

  const platform = (body as { platform?: unknown })?.platform;
  if (platform !== undefined && platform !== 'ios' && platform !== 'IOS') {
    return NextResponse.json({ error: 'Only iOS push devices are supported' }, { status: 400 });
  }

  const device = await prisma.$transaction(async (transaction) => {
    const existing = await transaction.pushDevice.findUnique({
      where: { token },
      select: { id: true, userId: true },
    });
    if (existing && existing.userId !== user.id) {
      await transaction.pushDelivery.updateMany({
        where: { deviceId: existing.id, status: 'PENDING' },
        data: {
          status: 'FAILED',
          lastError: 'Device was re-registered by another account',
          nextAttemptAt: null,
        },
      });
    }
    return transaction.pushDevice.upsert({
      where: { token },
      update: { userId: user.id, platform: 'ios', isActive: true, lastSeenAt: new Date() },
      create: { userId: user.id, token, platform: 'ios' },
      select: { id: true, token: true, platform: true, isActive: true, lastSeenAt: true },
    });
  });

  return NextResponse.json({
    id: device.id,
    token: device.token,
    platform: device.platform,
    isActive: device.isActive,
    lastSeenAt: device.lastSeenAt.toISOString(),
  }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  let token: string | null = new URL(request.url).searchParams.get('token');
  if (!token && request.headers.get('content-type')?.includes('application/json')) {
    try { token = readToken(await request.json()); } catch { /* treat as missing */ }
  }
  if (!token) return NextResponse.json({ error: 'A push token is required' }, { status: 400 });

  await prisma.$transaction(async (transaction) => {
    const device = await transaction.pushDevice.findFirst({
      where: { userId: user.id, token },
      select: { id: true },
    });
    if (!device) return;
    await transaction.pushDevice.update({
      where: { id: device.id },
      data: { isActive: false },
    });
    await transaction.pushDelivery.updateMany({
      where: { deviceId: device.id, status: 'PENDING' },
      data: {
        status: 'FAILED',
        lastError: 'Device was unregistered',
        nextAttemptAt: null,
      },
    });
  });
  return new NextResponse(null, { status: 204 });
}
