import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  clientFindMany: vi.fn(),
  notificationCreate: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    contactLead: { findMany: mocks.findMany, create: mocks.create },
    client: { findMany: mocks.clientFindMany },
    $transaction: mocks.transaction,
  },
}));

import { GET, POST } from './route';

function request(body?: unknown) {
  return new Request('http://localhost/api/contact-leads', {
    method: body === undefined ? 'GET' : 'POST',
    ...(body === undefined ? {} : {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
  }) as unknown as NextRequest;
}

const lead = {
  id: 'lead-1',
  name: 'Ava Marlowe',
  email: 'ava@example.com',
  message: 'We need a client portal.',
  createdAt: new Date('2026-08-13T10:00:00.000Z'),
};

describe('/api/contact-leads', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.transaction.mockImplementation(async (callback: (transaction: unknown) => unknown) => callback({
      contactLead: { create: mocks.create },
      user: { findMany: mocks.userFindMany },
      notification: { create: mocks.notificationCreate },
    }));
  });

  it('accepts a public custom inquiry and notifies staff', async () => {
    mocks.create.mockResolvedValue(lead);
    mocks.userFindMany.mockResolvedValue([{ id: 'staff-1' }]);
    mocks.authenticate.mockResolvedValue(null);

    const response = await POST(request({
      name: ' Ava Marlowe ',
      email: ' Ava@Example.com ',
      message: ' We need a client portal. ',
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: 'lead-1',
      name: 'Ava Marlowe',
      email: 'ava@example.com',
      message: 'We need a client portal.',
      createdAt: '2026-08-13T10:00:00.000Z',
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: { name: 'Ava Marlowe', email: 'ava@example.com', message: 'We need a client portal.' },
      select: { id: true, name: true, email: true, message: true, createdAt: true },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'staff-1',
        type: 'REQUEST_SUBMITTED',
        title: 'New custom inquiry',
        message: 'Ava Marlowe sent a custom package inquiry.',
      },
    });
  });

  it('rejects an incomplete public inquiry', async () => {
    const response = await POST(request({ name: 'Ava', email: 'ava@example.com' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Message is required and must be 2,000 characters or fewer',
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('lists inquiries for staff and marks converted emails', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findMany.mockResolvedValue([lead]);
    mocks.clientFindMany.mockResolvedValue([{ id: 'client-1', email: 'ava@example.com' }]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{
      id: 'lead-1',
      name: 'Ava Marlowe',
      email: 'ava@example.com',
      message: 'We need a client portal.',
      createdAt: '2026-08-13T10:00:00.000Z',
      clientId: 'client-1',
    }]);
  });
});
