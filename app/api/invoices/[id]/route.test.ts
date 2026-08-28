import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findFirst: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  transaction: vi.fn(),
  transactionUpdate: vi.fn(),
  transactionUpdateMany: vi.fn(),
  transactionFindUnique: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  noteCreate: vi.fn(),
  clientFindUnique: vi.fn(),
  userFindMany: vi.fn(),
  notificationCreate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    invoice: {
      findFirst: mocks.findFirst,
      findUnique: mocks.findUnique,
      updateMany: mocks.updateMany,
    },
    $transaction: mocks.transaction,
  },
}));

import { GET, PATCH } from './route';

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
  issuedAt: new Date('2026-08-11T10:00:00.000Z'),
  createdAt: new Date('2026-08-11T10:00:00.000Z'),
  stripeCheckoutAttemptId: null,
  stripeCheckoutSessionId: null,
  stripePaymentIntentId: null,
};

function request(status: string) {
  return new Request('http://localhost/api/invoices/inv-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }) as unknown as NextRequest;
}

function invoiceRequest(query = '') {
  return new NextRequest(`http://localhost/api/invoices/inv-1${query}`, {
    headers: { accept: 'application/json' },
  });
}

function params() {
  return { params: Promise.resolve({ id: 'inv-1' }) };
}

describe('PATCH /api/invoices/:id', () => {
  beforeEach(() => vi.clearAllMocks());

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
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({ ...invoice, status: 'PAYMENT_PENDING' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('PAYMENT_PENDING'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'inv-1',
      amountCents: 10000,
      status: 'PAYMENT_PENDING',
    });
    expect(mocks.transactionUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'inv-1', status: 'SENT' },
      data: { status: 'PAYMENT_PENDING' },
    }));
  });

  it('notifies the client when an invoice is sent', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ ...invoice, status: 'DRAFT' });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({ ...invoice, status: 'SENT' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('SENT'), params());

    expect(response.status).toBe(200);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'INVOICE_ISSUED',
        invoiceId: 'inv-1',
        projectId: 'proj-1',
        title: 'Invoice sent',
        message: 'Deposit is ready to review and pay.',
      },
    });
  });

  it('uses the extra-charge notification exactly once when an extra invoice is sent', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ ...invoice, type: 'EXTRA', status: 'DRAFT' });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({ ...invoice, type: 'EXTRA', status: 'SENT' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('SENT'), params());

    expect(response.status).toBe(200);
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-1',
        type: 'EXTRA_CHARGE_CREATED',
        invoiceId: 'inv-1',
        projectId: 'proj-1',
      }),
    });
  });

  it('returns a conflict when a concurrent invoice update wins the conditional claim', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ ...invoice, status: 'DRAFT' });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('SENT'), params());

    expect(response.status).toBe(409);
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('expires an open Stripe Session before voiding a pending invoice', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    const pendingInvoice = {
      ...invoice,
      status: 'PAYMENT_PENDING' as const,
      stripeCheckoutAttemptId: 'web_attempt-1',
      stripeCheckoutSessionId: 'cs-open',
    };
    mocks.findUnique.mockResolvedValue(pendingInvoice);
    mocks.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({
          id: 'cs-open',
          status: 'open',
          payment_status: 'unpaid',
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ id: 'cs-open', status: 'expired' }),
      });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({ ...pendingInvoice, status: 'VOIDED' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('VOIDED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'VOIDED' });
    expect(mocks.fetch.mock.calls[1]?.[0]).toBe(
      'https://api.stripe.com/v1/checkout/sessions/cs-open/expire',
    );
    expect(mocks.transactionUpdateMany).toHaveBeenCalledAfter(mocks.fetch);
  });

  it('does not void when an active Stripe Session cannot be expired', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'web_attempt-1',
      stripeCheckoutSessionId: 'cs-open',
    });
    mocks.fetch
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ status: 'open', payment_status: 'unpaid' }),
      })
      .mockResolvedValueOnce({ ok: false, status: 409, json: vi.fn() })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ status: 'open', payment_status: 'unpaid' }),
      });

    const response = await PATCH(request('VOIDED'), params());

    expect(response.status).toBe(502);
    expect(mocks.transactionUpdateMany).not.toHaveBeenCalled();
  });

  it('settles a paid Stripe Session and blocks voiding it', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'web_attempt-1',
      stripeCheckoutSessionId: 'cs-paid',
    });
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 'cs-paid',
        status: 'complete',
        payment_status: 'paid',
        payment_intent: 'pi-paid',
      }),
    });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({
      id: 'inv-1',
      projectId: 'proj-1',
      clientId: 'client-1',
      type: 'DEPOSIT',
      status: 'PAID',
    });
    mocks.projectFindUnique.mockResolvedValue({ status: 'DISCOVERY' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
    mocks.userFindMany.mockResolvedValue([{ id: 'staff-1' }]);
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      project: { findUnique: mocks.projectFindUnique, update: mocks.projectUpdate },
      note: { create: mocks.noteCreate },
      client: { findUnique: mocks.clientFindUnique },
      user: { findMany: mocks.userFindMany },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('VOIDED'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'A paid invoice cannot be voided' });
    expect(mocks.transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({
        status: 'PAID',
        stripeCheckoutSessionId: 'cs-paid',
        stripePaymentIntentId: 'pi-paid',
      }),
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});

describe('GET /api/invoices/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test';
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });
  });

  it('marks an abandoned Checkout Session failed when Stripe has no payment method', async () => {
    const pendingInvoice = {
      ...invoice,
      status: 'PAYMENT_PENDING' as const,
      stripeCheckoutSessionId: 'cs-abandoned',
      stripePaymentIntentId: null,
    };
    mocks.findFirst.mockResolvedValue(pendingInvoice);
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'open',
        payment_status: 'unpaid',
        payment_intent: { id: 'pi-abandoned', status: 'requires_payment_method' },
      }),
    });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({ ...pendingInvoice, status: 'FAILED' });
    mocks.findUnique.mockResolvedValue({ ...pendingInvoice, status: 'FAILED' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      client: { findUnique: mocks.clientFindUnique },
      user: { findMany: vi.fn().mockResolvedValue([{ id: 'staff-1' }]) },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await GET(invoiceRequest('?reconcilePayment=true'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'inv-1', status: 'FAILED' });
    expect(mocks.transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', status: 'PAYMENT_PENDING' },
      data: { status: 'FAILED', stripePaymentIntentId: 'pi-abandoned' },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
  });

  it('repairs a missed success webhook from Stripe server-to-server state', async () => {
    const pendingInvoice = {
      ...invoice,
      status: 'PAYMENT_PENDING' as const,
      stripeCheckoutAttemptId: 'mobile_attempt-1',
      stripeCheckoutSessionId: 'cs-paid',
      stripePaymentIntentId: null,
    };
    const paidInvoice = {
      ...pendingInvoice,
      status: 'PAID' as const,
      paidAt: new Date('2026-08-28T08:00:00.000Z'),
      stripePaymentIntentId: 'pi-paid',
    };
    mocks.findFirst.mockResolvedValue(pendingInvoice);
    mocks.fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        id: 'cs-paid',
        status: 'complete',
        payment_status: 'paid',
        payment_intent: { id: 'pi-paid', status: 'succeeded' },
      }),
    });
    mocks.transactionUpdateMany.mockResolvedValue({ count: 1 });
    mocks.transactionFindUnique.mockResolvedValue({
      id: 'inv-1',
      projectId: 'proj-1',
      clientId: 'client-1',
      type: 'DEPOSIT',
      status: 'PAID',
    });
    mocks.projectFindUnique.mockResolvedValue({ status: 'DISCOVERY' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
    mocks.userFindMany.mockResolvedValue([{ id: 'staff-1' }]);
    mocks.findUnique.mockResolvedValue(paidInvoice);
    mocks.transaction.mockImplementation(async (callback) => callback({
      invoice: { updateMany: mocks.transactionUpdateMany, findUnique: mocks.transactionFindUnique },
      project: { findUnique: mocks.projectFindUnique, update: mocks.projectUpdate },
      note: { create: mocks.noteCreate },
      client: { findUnique: mocks.clientFindUnique },
      user: { findMany: mocks.userFindMany },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await GET(invoiceRequest('?reconcilePayment=true'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'PAID', paidAt: '2026-08-28T08:00:00.000Z' });
    expect(mocks.transactionUpdateMany).toHaveBeenCalledWith({
      where: { id: 'inv-1', status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({
        status: 'PAID',
        stripeCheckoutSessionId: 'cs-paid',
        stripePaymentIntentId: 'pi-paid',
      }),
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
  });

  it('keeps a genuinely processing PaymentIntent pending', async () => {
    const pendingInvoice = {
      ...invoice,
      status: 'PAYMENT_PENDING' as const,
      stripeCheckoutSessionId: 'cs-processing',
      stripePaymentIntentId: null,
    };
    mocks.findFirst.mockResolvedValue(pendingInvoice);
    mocks.fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: 'open',
        payment_status: 'unpaid',
        payment_intent: { id: 'pi-processing', status: 'processing' },
      }),
    });

    const response = await GET(invoiceRequest('?reconcilePayment=true'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'inv-1', status: 'PAYMENT_PENDING' });
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });

  it('does not inspect Stripe during an ordinary invoice read', async () => {
    const pendingInvoice = {
      ...invoice,
      status: 'PAYMENT_PENDING' as const,
      stripeCheckoutSessionId: 'cs-pending',
      stripePaymentIntentId: null,
    };
    mocks.findFirst.mockResolvedValue(pendingInvoice);

    const response = await GET(invoiceRequest(), params());

    expect(response.status).toBe(200);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.updateMany).not.toHaveBeenCalled();
  });
});
