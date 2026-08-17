import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  upsert: vi.fn(),
  deviceFindUnique: vi.fn(),
  deviceFindFirst: vi.fn(),
  deviceUpdate: vi.fn(),
  deliveryUpdateMany: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { DELETE, POST } from './route';

function request(method: string, body?: unknown, token?: string) {
  const url = new URL('http://localhost/api/notifications/devices');
  if (token) url.searchParams.set('token', token);
  return new Request(url, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as NextRequest;
}

describe('/api/notifications/devices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication before accepting a token', async () => {
    mocks.authenticate.mockResolvedValue(null);
    const response = await POST(request('POST', { token: 'ExponentPushToken[abc123456]' }));
    expect(response.status).toBe(401);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it('registers an iOS Expo token for the authenticated user', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.deviceFindUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) => callback({
      pushDevice: { findUnique: mocks.deviceFindUnique, upsert: mocks.upsert },
      pushDelivery: { updateMany: mocks.deliveryUpdateMany },
    }));
    mocks.upsert.mockResolvedValue({
      id: 'device-1', token: 'ExponentPushToken[abc123456]', platform: 'ios',
      isActive: true, lastSeenAt: new Date('2026-08-17T10:00:00.000Z'),
    });
    const response = await POST(request('POST', { token: 'ExponentPushToken[abc123456]', platform: 'ios' }));
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ id: 'device-1', platform: 'ios', isActive: true });
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { token: 'ExponentPushToken[abc123456]' },
      update: expect.objectContaining({ userId: 'user-1', isActive: true }),
      create: { userId: 'user-1', token: 'ExponentPushToken[abc123456]', platform: 'ios' },
    }));
  });

  it('deactivates only the authenticated user’s token on logout', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.deviceFindFirst.mockResolvedValue({ id: 'device-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      pushDevice: { findFirst: mocks.deviceFindFirst, update: mocks.deviceUpdate },
      pushDelivery: { updateMany: mocks.deliveryUpdateMany },
    }));
    const response = await DELETE(request('DELETE', undefined, 'ExponentPushToken[abc123456]'));
    expect(response.status).toBe(204);
    expect(mocks.deviceUpdate).toHaveBeenCalledWith({
      where: { id: 'device-1' },
      data: { isActive: false },
    });
    expect(mocks.deliveryUpdateMany).toHaveBeenCalledWith({
      where: { deviceId: 'device-1', status: 'PENDING' },
      data: expect.objectContaining({ status: 'FAILED' }),
    });
  });

  it('fails queued deliveries before transferring a token to another account', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-2', role: 'CLIENT' });
    mocks.deviceFindUnique.mockResolvedValue({ id: 'device-1', userId: 'user-1' });
    mocks.upsert.mockResolvedValue({
      id: 'device-1', token: 'ExponentPushToken[abc123456]', platform: 'ios',
      isActive: true, lastSeenAt: new Date('2026-08-17T10:00:00.000Z'),
    });
    mocks.transaction.mockImplementation(async (callback) => callback({
      pushDevice: { findUnique: mocks.deviceFindUnique, upsert: mocks.upsert },
      pushDelivery: { updateMany: mocks.deliveryUpdateMany },
    }));

    const response = await POST(request('POST', { token: 'ExponentPushToken[abc123456]', platform: 'IOS' }));

    expect(response.status).toBe(201);
    expect(mocks.deliveryUpdateMany).toHaveBeenCalledWith({
      where: { deviceId: 'device-1', status: 'PENDING' },
      data: expect.objectContaining({ status: 'FAILED' }),
    });
  });
});
