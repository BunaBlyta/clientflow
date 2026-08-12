import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
  transaction: vi.fn(),
  projectFindUnique: vi.fn(),
  clientFindUnique: vi.fn(),
  invoiceCreate: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    invoice: { findMany: mocks.findMany },
    $transaction: mocks.transaction,
  },
}));

import { POST } from './route';

const invoice = {
  id: 'inv-new',
  projectId: 'proj-1',
  clientId: 'client-1',
  type: 'EXTRA' as const,
  description: 'Extra landing sections',
  amount: '450.00',
  status: 'DRAFT' as const,
  dueDate: new Date('2026-08-20T00:00:00.000Z'),
  paidAt: null,
  createdAt: new Date('2026-08-12T10:00:00.000Z'),
};

function request(body: unknown) {
  return new Request('http://localhost/api/invoices', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function setupTransaction() {
  mocks.transaction.mockImplementation(async (callback) => callback({
    project: { findUnique: mocks.projectFindUnique },
    client: { findUnique: mocks.clientFindUnique },
    invoice: { create: mocks.invoiceCreate },
    notification: { create: mocks.notificationCreate },
  }));
}

describe('POST /api/invoices', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses clients before reading the project', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });

    const response = await POST(request({
      projectId: 'proj-1',
      type: 'EXTRA',
      amount: '450.00',
      currency: 'usd',
    }));

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it.each(['PAID', 'PAYMENT_PENDING'])('rejects a requested %s starting state', async (status) => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });

    const response = await POST(request({
      projectId: 'proj-1',
      type: 'EXTRA',
      amount: '450.00',
      currency: 'usd',
      status,
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'New invoices must start in DRAFT' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates a draft invoice from the project owner and notifies that client', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      clientId: 'client-1',
      name: 'Riverside Cafe — Full Website',
    });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
    mocks.invoiceCreate.mockResolvedValue(invoice);
    setupTransaction();

    const response = await POST(request({
      projectId: 'proj-1',
      type: 'EXTRA',
      amount: '450',
      currency: 'USD',
      dueDate: '2026-08-20',
      description: 'Extra landing sections',
      clientId: 'client-from-body',
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: 'inv-new',
      projectId: 'proj-1',
      clientId: 'client-1',
      kind: 'EXTRA',
      amountCents: 45000,
      status: 'DRAFT',
    });
    expect(mocks.projectFindUnique).toHaveBeenCalledWith({
      where: { id: 'proj-1' },
      select: { id: true, clientId: true, name: true },
    });
    expect(mocks.invoiceCreate).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        clientId: 'client-1',
        type: 'EXTRA',
        amount: '450.00',
        currency: 'usd',
        status: 'DRAFT',
        description: 'Extra landing sections',
        dueDate: new Date('2026-08-20T00:00:00.000Z'),
      },
      select: expect.any(Object),
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-client-1',
        type: 'EXTRA_CHARGE_CREATED',
        title: 'New invoice',
        message: 'Extra landing sections was added to Riverside Cafe — Full Website.',
      },
    });
  });

  it('returns 404 without creating an invoice for an unknown project', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.projectFindUnique.mockResolvedValue(null);
    setupTransaction();

    const response = await POST(request({
      projectId: 'missing',
      type: 'EXTRA',
      amount: '450.00',
      currency: 'usd',
    }));

    expect(response.status).toBe(404);
    expect(mocks.invoiceCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });
});
