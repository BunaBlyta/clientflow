import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  verifySignature: vi.fn(),
  transaction: vi.fn(),
  invoiceFindUnique: vi.fn(),
  invoiceUpdate: vi.fn(),
  invoiceUpdateMany: vi.fn(),
  projectFindUnique: vi.fn(),
  projectUpdate: vi.fn(),
  noteCreate: vi.fn(),
  notificationCreate: vi.fn(),
  clientFindUnique: vi.fn(),
}));

vi.mock('@/app/api/_lib/stripe', () => ({
  verifyStripeSignature: mocks.verifySignature,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { $transaction: mocks.transaction },
}));

import { POST } from './route';

const invoiceId = 'invoice-1';

function request(event: unknown, signature?: string) {
  const headers = new Headers({ 'content-type': 'application/json' });
  if (signature) headers.set('stripe-signature', signature);

  return new Request('http://localhost/api/stripe/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  }) as unknown as NextRequest;
}

function paymentEvent(type: string) {
  const isPaymentIntent = type.startsWith('payment_intent.');
  return {
    type,
    data: {
      object: {
        id: isPaymentIntent ? 'payment-intent-1' : 'checkout-session-1',
        object: isPaymentIntent ? 'payment_intent' : 'checkout.session',
        metadata: { invoiceId },
        ...(isPaymentIntent ? {} : { payment_intent: 'payment-intent-1' }),
        payment_status: 'paid',
      },
    },
  };
}

function configureTransaction() {
  mocks.transaction.mockImplementation(async (callback) => callback({
    invoice: {
      findUnique: mocks.invoiceFindUnique,
      update: mocks.invoiceUpdate,
      updateMany: mocks.invoiceUpdateMany,
    },
    project: {
      findUnique: mocks.projectFindUnique,
      update: mocks.projectUpdate,
    },
    note: { create: mocks.noteCreate },
    notification: { create: mocks.notificationCreate },
    client: { findUnique: mocks.clientFindUnique },
  }));
}

function configureInvoice(type: 'DEPOSIT' | 'FINAL' | 'EXTRA' | 'CUSTOM', status = 'PAYMENT_PENDING') {
  mocks.invoiceFindUnique.mockResolvedValue({
    id: invoiceId,
    projectId: 'project-1',
    clientId: 'client-1',
    type,
    status,
  });
  mocks.invoiceUpdate.mockResolvedValue({});
  mocks.invoiceUpdateMany.mockResolvedValue({ count: 1 });
  mocks.projectFindUnique.mockResolvedValue({ status: 'PENDING' });
  mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });
}

beforeEach(() => {
  vi.resetAllMocks();
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
  mocks.verifySignature.mockReturnValue(true);
  configureTransaction();
});

describe('POST /api/stripe/webhook', () => {
  it('marks a deposit paid, advances a pending project, and notifies once', async () => {
    let invoiceStatus = 'PAYMENT_PENDING';
    configureInvoice('DEPOSIT');
    mocks.invoiceUpdateMany.mockImplementation(async () => {
      if (invoiceStatus === 'PAID') return { count: 0 };
      invoiceStatus = 'PAID';
      return { count: 1 };
    });
    mocks.invoiceFindUnique.mockImplementation(async () => ({
      id: invoiceId,
      projectId: 'project-1',
      clientId: 'client-1',
      type: 'DEPOSIT',
      status: invoiceStatus,
    }));
    mocks.invoiceUpdate.mockImplementation(async ({ data }) => {
      invoiceStatus = data.status;
      return {};
    });

    const event = paymentEvent('checkout.session.completed');
    const firstResponse = await POST(request(event, 'sig_test'));
    const secondResponse = await POST(request(event, 'sig_test'));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledTimes(2);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({
        status: 'PAID',
        stripeCheckoutSessionId: 'checkout-session-1',
        stripePaymentIntentId: 'payment-intent-1',
      }),
    });
    expect(mocks.projectUpdate).toHaveBeenCalledTimes(1);
    expect(mocks.projectUpdate).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'DISCOVERY' },
    });
    expect(mocks.noteCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-client-1',
        type: 'PAYMENT_SUCCEEDED',
        invoiceId,
        projectId: 'project-1',
      }),
    });
  });

  it('does not create success side effects when the paid-state claim loses a race', async () => {
    configureInvoice('DEPOSIT');
    mocks.invoiceUpdateMany.mockResolvedValue({ count: 0 });

    const response = await POST(request(paymentEvent('checkout.session.completed'), 'sig_test'));

    expect(response.status).toBe(200);
    expect(mocks.invoiceFindUnique).not.toHaveBeenCalled();
    expect(mocks.projectUpdate).not.toHaveBeenCalled();
    expect(mocks.noteCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('marks a delayed Checkout payment paid when it eventually succeeds', async () => {
    configureInvoice('FINAL');

    const response = await POST(
      request(paymentEvent('checkout.session.async_payment_succeeded'), 'sig_test'),
    );

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({ status: 'PAID' }),
    });
  });

  it('stores a real PaymentIntent success ID without overwriting the Checkout Session ID', async () => {
    configureInvoice('FINAL');

    const response = await POST(
      request(paymentEvent('payment_intent.succeeded'), 'sig_test'),
    );

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({
        status: 'PAID',
        stripePaymentIntentId: 'payment-intent-1',
      }),
    });
    expect(mocks.invoiceUpdateMany.mock.calls[0]?.[0]?.data).not.toHaveProperty(
      'stripeCheckoutSessionId',
    );
  });

  it('keeps a delayed Checkout Session pending until funds arrive', async () => {
    configureInvoice('FINAL');
    const event = paymentEvent('checkout.session.completed');
    event.data.object.payment_status = 'unpaid';

    const response = await POST(request(event, 'sig_test'));

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it.each(['FINAL', 'EXTRA'] as const)(
    'does not advance a pending project for a %s invoice',
    async (type) => {
      configureInvoice(type);

      const response = await POST(request(paymentEvent('checkout.session.completed'), 'sig_test'));

      expect(response.status).toBe(200);
      expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
        where: { id: invoiceId, status: 'PAYMENT_PENDING' },
        data: expect.objectContaining({ status: 'PAID' }),
      });
      expect(mocks.projectFindUnique).toHaveBeenCalledTimes(1);
      expect(mocks.projectUpdate).not.toHaveBeenCalled();
      expect(mocks.noteCreate).not.toHaveBeenCalled();
      expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    },
  );

  it('marks a custom invoice paid, advances a pending project, and records the payment note', async () => {
    configureInvoice('CUSTOM');

    const response = await POST(request(paymentEvent('checkout.session.completed'), 'sig_test'));

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: expect.objectContaining({ status: 'PAID' }),
    });
    expect(mocks.projectUpdate).toHaveBeenCalledWith({
      where: { id: 'project-1' },
      data: { status: 'DISCOVERY' },
    });
    expect(mocks.noteCreate).toHaveBeenCalledWith({
      data: {
        projectId: 'project-1',
        content: 'Custom invoice payment confirmed. Project moved to Discovery.',
        isSystem: true,
      },
    });
  });

  it('marks a failed payment and ignores the identical failure event', async () => {
    let alreadyFailed = false;
    mocks.invoiceUpdateMany.mockImplementation(async () => {
      if (alreadyFailed) return { count: 0 };
      alreadyFailed = true;
      return { count: 1 };
    });
    mocks.invoiceFindUnique.mockResolvedValue({
      id: invoiceId,
      clientId: 'client-1',
      projectId: 'project-1',
    });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-client-1' });

    const event = paymentEvent('payment_intent.payment_failed');
    const firstResponse = await POST(request(event, 'sig_test'));
    const secondResponse = await POST(request(event, 'sig_test'));

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledTimes(2);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: { status: 'FAILED', stripePaymentIntentId: 'payment-intent-1' },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-client-1',
        type: 'PAYMENT_FAILED',
        invoiceId,
        projectId: 'project-1',
      }),
    });
  });

  it('marks an expired Checkout Session failed', async () => {
    configureInvoice('FINAL');

    const response = await POST(request(paymentEvent('checkout.session.expired'), 'sig_test'));

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: { status: 'FAILED', stripePaymentIntentId: 'payment-intent-1' },
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        type: 'PAYMENT_FAILED',
        invoiceId,
      }),
    });
  });

  it('marks a delayed Checkout payment failed when it eventually fails', async () => {
    configureInvoice('FINAL');

    const response = await POST(
      request(paymentEvent('checkout.session.async_payment_failed'), 'sig_test'),
    );

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: { id: invoiceId, status: 'PAYMENT_PENDING' },
      data: { status: 'FAILED', stripePaymentIntentId: 'payment-intent-1' },
    });
  });

  it('does nothing when a failure arrives for an already-paid invoice', async () => {
    mocks.invoiceUpdateMany.mockResolvedValue({ count: 0 });

    const response = await POST(request(paymentEvent('payment_intent.payment_failed'), 'sig_test'));

    expect(response.status).toBe(200);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceFindUnique).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('rejects a request with no stripe signature', async () => {
    const response = await POST(request(paymentEvent('checkout.session.completed')));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Stripe signature required' });
    expect(mocks.verifySignature).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('rejects a request with an invalid stripe signature', async () => {
    mocks.verifySignature.mockReturnValue(false);

    const response = await POST(request(paymentEvent('checkout.session.completed'), 'sig_invalid'));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid Stripe signature' });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
