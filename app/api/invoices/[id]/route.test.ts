import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

import { PATCH } from './route';

const invoice = {
  id: 'inv-1',
  projectId: 'proj-1',
  clientId: 'client-1',
  type: 'DEPOSIT' as const,
  description: 'Deposit',
  amount: '100.00',
  status: 'SENT' as const,
  dueDate: null,
  paidAt: null,
  createdAt: new Date('2026-08-11T10:00:00.000Z'),
};

function request(status: string) {
  return new Request('http://localhost/api/invoices/inv-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }) as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'inv-1' }) };
}

describe('PATCH /api/invoices/:id', () => {
  it('refuses clients before looking up the invoice', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });

    const response = await PATCH(request('VOIDED'), params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects SENT to PAID because payment confirmation belongs to Stripe', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(invoice);

    const response = await PATCH(request('PAID'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Invoice cannot transition from SENT to PAID through this endpoint',
    });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('returns 409 for an illegal state-machine transition', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ ...invoice, status: 'VOIDED' });

    const response = await PATCH(request('SENT'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Invoice cannot transition from VOIDED to SENT',
    });
  });

  it('updates a legal staff transition and returns the serialized invoice', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(invoice);
    mocks.update.mockResolvedValue({ ...invoice, status: 'PAYMENT_PENDING' });

    const response = await PATCH(request('PAYMENT_PENDING'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'inv-1',
      amountCents: 10000,
      status: 'PAYMENT_PENDING',
    });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'inv-1' },
      data: { status: 'PAYMENT_PENDING' },
    }));
  });
});
