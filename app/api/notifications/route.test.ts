import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    notification: { findMany: mocks.findMany },
  },
}));

import { GET } from './route';

function request() {
  return new Request('http://localhost/api/notifications') as unknown as NextRequest;
}

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('serializes nullable navigation targets without deriving them from text', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findMany.mockResolvedValue([
      {
        id: 'notif-invoice',
        userId: 'user-1',
        type: 'PAYMENT_SUCCEEDED',
        title: 'Payment received',
        message: 'An unrelated message.',
        readAt: null,
        createdAt: new Date('2026-08-12T10:00:00.000Z'),
        projectId: 'proj-1',
        invoiceId: 'inv-1',
        requestId: null,
      },
      {
        id: 'notif-request',
        userId: 'user-1',
        type: 'REQUEST_APPROVED',
        title: 'Project request approved',
        message: 'The message does not contain an ID.',
        readAt: new Date('2026-08-12T09:00:00.000Z'),
        createdAt: new Date('2026-08-12T09:00:00.000Z'),
        projectId: 'proj-2',
        invoiceId: null,
        requestId: 'req-1',
      },
    ]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'notif-invoice',
        userId: 'user-1',
        type: 'PAYMENT_SUCCEEDED',
        title: 'Payment received',
        body: 'An unrelated message.',
        projectId: 'proj-1',
        invoiceId: 'inv-1',
        requestId: null,
        read: false,
        createdAt: '2026-08-12T10:00:00.000Z',
      },
      {
        id: 'notif-request',
        userId: 'user-1',
        type: 'REQUEST_APPROVED',
        title: 'Project request approved',
        body: 'The message does not contain an ID.',
        projectId: 'proj-2',
        invoiceId: null,
        requestId: 'req-1',
        read: true,
        createdAt: '2026-08-12T09:00:00.000Z',
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1' },
      select: expect.objectContaining({
        projectId: true,
        invoiceId: true,
        requestId: true,
      }),
    }));
  });
});
