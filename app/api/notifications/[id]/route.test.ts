import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    notification: {
      findFirst: mocks.findFirst,
      update: mocks.update,
    },
  },
}));

import { PATCH } from './route';

const notification = {
  id: 'notif-1',
  userId: 'user-1',
  type: 'NEW_NOTE',
  title: 'New note',
  message: 'A note was posted.',
  readAt: null,
  archivedAt: null,
  createdAt: new Date('2026-08-12T10:00:00.000Z'),
  projectId: 'proj-1',
  invoiceId: 'inv-1',
  requestId: null,
};

function request(body?: unknown) {
  return new Request('http://localhost/api/notifications/notif-1', {
    method: 'PATCH',
    ...(body === undefined ? {} : {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  }) as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'notif-1' }) };
}

describe('PATCH /api/notifications/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for another user notification without confirming ownership', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(null);

    const response = await PATCH(request(), params());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Notification not found' });
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notif-1', userId: 'user-1' },
    }));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('marks an unread notification and returns the GET response shape', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(notification);
    mocks.update.mockResolvedValue({
      ...notification,
      readAt: new Date('2026-08-12T10:05:00.000Z'),
    });

    const response = await PATCH(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'notif-1',
      userId: 'user-1',
      type: 'NEW_NOTE',
      title: 'New note',
      body: 'A note was posted.',
      projectId: 'proj-1',
      invoiceId: 'inv-1',
      requestId: null,
      read: true,
      archived: false,
      createdAt: '2026-08-12T10:00:00.000Z',
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notif-1' },
      data: { readAt: expect.any(Date) },
      select: expect.objectContaining({
        projectId: true,
        invoiceId: true,
        requestId: true,
        archivedAt: true,
      }),
    }));
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({
        projectId: true,
        invoiceId: true,
        requestId: true,
      }),
    }));
  });

  it('returns 200 without writing when the notification is already read', async () => {
    const readNotification = {
      ...notification,
      readAt: new Date('2026-08-12T10:03:00.000Z'),
    };
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(readNotification);

    const response = await PATCH(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'notif-1',
      read: true,
      archived: false,
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('archives an owned notification without marking it read', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(notification);
    mocks.update.mockResolvedValue({
      ...notification,
      archivedAt: new Date('2026-08-12T10:05:00.000Z'),
    });

    const response = await PATCH(request({ archived: true }), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'notif-1',
      read: false,
      archived: true,
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'notif-1' },
      data: { archivedAt: expect.any(Date) },
      select: expect.objectContaining({ archivedAt: true }),
    }));
  });

  it('unarchives an owned notification and preserves its read state', async () => {
    const archivedNotification = {
      ...notification,
      readAt: new Date('2026-08-12T10:03:00.000Z'),
      archivedAt: new Date('2026-08-12T10:04:00.000Z'),
    };
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(archivedNotification);
    mocks.update.mockResolvedValue({ ...archivedNotification, archivedAt: null });

    const response = await PATCH(request({ archived: false }), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'notif-1',
      read: true,
      archived: false,
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      data: { archivedAt: null },
    }));
  });

  it('rejects a non-boolean archive value before checking the record', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });

    const response = await PATCH(request({ archived: 'true' }), params());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'archived must be a boolean' });
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });
});
