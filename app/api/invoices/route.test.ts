import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';
import { serializeInvoice } from './serialize';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
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
  prisma: { $transaction: mocks.transaction },
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/invoices', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('invoice API response mapping', () => {
  beforeEach(() => vi.clearAllMocks());

  it('converts major-unit amounts to cents', () => {
    const invoice = serializeInvoice({
      id: 'inv-test',
      projectId: 'proj-test',
      clientId: 'client-test',
      type: 'DEPOSIT',
      description: 'Deposit — Full Website',
      amount: '3250.00',
      status: 'PAID',
      dueDate: null,
      paidAt: new Date('2026-06-03T08:20:00.000Z'),
      createdAt: new Date('2026-06-02T14:10:00.000Z'),
    });

    expect(invoice.amountCents).toBe(325000);
  });

  it('uses a readable label when the description is missing', () => {
    const invoice = serializeInvoice({
      id: 'inv-test',
      projectId: 'proj-test',
      clientId: 'client-test',
      type: 'CUSTOM',
      description: null,
      amount: 100,
      status: 'SENT',
      dueDate: new Date('2026-08-01T00:00:00.000Z'),
      paidAt: null,
      createdAt: new Date('2026-07-01T00:00:00.000Z'),
    });

    expect(invoice.kind).toBe('CUSTOM');
    expect(invoice.label).toBe('Custom invoice');
    expect(invoice.dueDate).toBe('2026-08-01T00:00:00.000Z');
    expect(invoice.paidAt).toBeUndefined();
  });
});

describe('POST /api/invoices draft behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      clientId: 'client-1',
      name: 'Riverside Cafe — Full Website',
    });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      project: { findUnique: mocks.projectFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      invoice: { create: mocks.invoiceCreate },
      notification: { create: mocks.notificationCreate },
    }));
  });

  it.each(['DEPOSIT', 'FINAL', 'CUSTOM', 'EXTRA'] as const)(
    'does not notify when a %s invoice is still a draft',
    async (type) => {
      mocks.invoiceCreate.mockResolvedValue({
        id: 'inv-new',
        projectId: 'proj-1',
        clientId: 'client-1',
        type,
        description: null,
        amount: '100.00',
        status: 'DRAFT',
        dueDate: null,
        paidAt: null,
        createdAt: new Date('2026-08-12T10:00:00.000Z'),
      });

      const response = await POST(request({
        projectId: 'proj-1',
        type,
        amount: '100.00',
        currency: 'usd',
      }));

      expect(response.status).toBe(201);
      expect(mocks.notificationCreate).not.toHaveBeenCalled();
    },
  );
});
