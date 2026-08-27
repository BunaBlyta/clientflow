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
        archivedAt: null,
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
        archivedAt: null,
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
        archived: false,
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
        archived: false,
        createdAt: '2026-08-12T09:00:00.000Z',
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1', archivedAt: null },
      select: expect.objectContaining({
        projectId: true,
        invoiceId: true,
        requestId: true,
        archivedAt: true,
      }),
    }));
  });

  it('returns a bounded paginated envelope and reports whether another page exists', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findMany.mockResolvedValue([
      {
        id: 'notif-3',
        userId: 'user-1',
        type: 'NEW_NOTE',
        title: 'Third',
        message: 'Third notification',
        readAt: null,
        archivedAt: null,
        createdAt: new Date('2026-08-12T08:00:00.000Z'),
        projectId: null,
        invoiceId: null,
        requestId: null,
      },
      {
        id: 'notif-2',
        userId: 'user-1',
        type: 'NEW_NOTE',
        title: 'Second',
        message: 'Second notification',
        readAt: null,
        archivedAt: null,
        createdAt: new Date('2026-08-12T07:00:00.000Z'),
        projectId: null,
        invoiceId: null,
        requestId: null,
      },
      {
        id: 'notif-1',
        userId: 'user-1',
        type: 'NEW_NOTE',
        title: 'First',
        message: 'First notification',
        readAt: null,
        archivedAt: null,
        createdAt: new Date('2026-08-12T06:00:00.000Z'),
        projectId: null,
        invoiceId: null,
        requestId: null,
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/notifications?page=2&limit=2') as unknown as NextRequest,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      notifications: [
        {
          id: 'notif-3',
          userId: 'user-1',
          type: 'NEW_NOTE',
          title: 'Third',
          body: 'Third notification',
          projectId: null,
          invoiceId: null,
          requestId: null,
          read: false,
          archived: false,
          createdAt: '2026-08-12T08:00:00.000Z',
        },
        {
          id: 'notif-2',
          userId: 'user-1',
          type: 'NEW_NOTE',
          title: 'Second',
          body: 'Second notification',
          projectId: null,
          invoiceId: null,
          requestId: null,
          read: false,
          archived: false,
          createdAt: '2026-08-12T07:00:00.000Z',
        },
      ],
      page: 2,
      pageSize: 2,
      hasMore: true,
    });
    expect(response.headers.get('X-Notifications-Has-More')).toBe('true');
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: 'user-1', archivedAt: null }),
      skip: 2,
      take: 3,
    }));
  });

  it('can request archived notifications without mixing archive state with read state', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findMany.mockResolvedValue([
      {
        id: 'notif-archived',
        userId: 'user-1',
        type: 'NEW_NOTE',
        title: 'Archived note',
        message: 'Still unread',
        readAt: null,
        archivedAt: new Date('2026-08-12T10:05:00.000Z'),
        createdAt: new Date('2026-08-12T10:00:00.000Z'),
        projectId: null,
        invoiceId: null,
        requestId: null,
      },
    ]);

    const response = await GET(
      new Request('http://localhost/api/notifications?archived=archived') as unknown as NextRequest,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([
      expect.objectContaining({ id: 'notif-archived', read: false, archived: true }),
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId: 'user-1', archivedAt: { not: null } },
    }));
  });

  it('rejects invalid pagination values before querying', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });

    const response = await GET(
      new Request('http://localhost/api/notifications?page=0') as unknown as NextRequest,
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'page must be between 1 and 10000' });
    expect(mocks.findMany).not.toHaveBeenCalled();
  });
});
