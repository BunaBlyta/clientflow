import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  upsert: vi.fn(),
  updateMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { pushDevice: { upsert: mocks.upsert, updateMany: mocks.updateMany } },
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
    const response = await DELETE(request('DELETE', undefined, 'ExponentPushToken[abc123456]'));
    expect(response.status).toBe(204);
    expect(mocks.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', token: 'ExponentPushToken[abc123456]' },
      data: { isActive: false },
    });
  });
});
