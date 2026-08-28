import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  invoiceFindFirst: vi.fn(),
  invoiceUpdateMany: vi.fn(),
  markInvoicePaid: vi.fn(),
  markInvoiceFailed: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    invoice: {
      findFirst: mocks.invoiceFindFirst,
      updateMany: mocks.invoiceUpdateMany,
    },
  },
}));

vi.mock('@/app/api/_lib/invoice-payments', () => ({
  markInvoicePaid: mocks.markInvoicePaid,
  markInvoiceFailed: mocks.markInvoiceFailed,
}));

import { POST } from './route';

const invoice = {
  id: 'inv-1',
  projectId: 'proj-1',
  description: 'Deposit — Full Website',
  amount: '3250.00',
  currency: 'usd',
  status: 'SENT',
  stripeCheckoutAttemptId: null,
  stripeCheckoutSessionId: null,
};

function request(body: unknown) {
  return new Request('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function stripeResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 400,
    json: vi.fn().mockResolvedValue(body),
  };
}

function createSessionResponse() {
  return stripeResponse({ id: 'cs-new', url: 'https://checkout.stripe.test/cs-new' });
}

function requestBody(callIndex = 0) {
  const init = mocks.fetch.mock.calls[callIndex]?.[1] as RequestInit | undefined;
  return new URLSearchParams(String(init?.body));
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  process.env.APP_URL = 'https://app.clientflow.test';
  mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });
  mocks.invoiceFindFirst.mockResolvedValue(invoice);
  mocks.invoiceUpdateMany.mockResolvedValue({ count: 1 });
  mocks.markInvoicePaid.mockResolvedValue(true);
  mocks.markInvoiceFailed.mockResolvedValue(true);
  vi.stubGlobal('fetch', mocks.fetch);
});

describe('POST /api/stripe/checkout', () => {
  it('requires authentication before looking up an invoice', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it('scopes client invoice lookup to the authenticated client', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(200);
    expect(mocks.invoiceFindFirst).toHaveBeenCalledWith({
      where: { id: 'inv-1', client: { userId: 'user-client-1' } },
      select: {
        id: true,
        projectId: true,
        description: true,
        amount: true,
        currency: true,
        status: true,
        stripeCheckoutAttemptId: true,
        stripeCheckoutSessionId: true,
      },
    });
  });

  it('preserves the web success URL and response shape when returnTo is omitted', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.fetch.mockResolvedValue(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
    expect(requestBody().get('success_url')).toBe(
      'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}',
    );
    const cancelUrl = new URL(String(requestBody().get('cancel_url')));
    expect(cancelUrl.origin + cancelUrl.pathname).toBe(
      'https://app.clientflow.test/api/stripe/checkout/cancel',
    );
    expect(cancelUrl.searchParams.get('invoice_id')).toBe('inv-1');
    expect(cancelUrl.searchParams.get('attempt_id')).toMatch(/^web_/);
  });

  it('constructs the fixed mobile success URL when returnTo is mobile', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(requestBody().get('success_url')).toBe(
      'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    );
    const cancelUrl = new URL(String(requestBody().get('cancel_url')));
    expect(cancelUrl.origin + cancelUrl.pathname).toBe(
      'https://app.clientflow.test/api/stripe/checkout/cancel',
    );
    expect(cancelUrl.searchParams.get('return_to')).toBe('mobile');
    expect(cancelUrl.searchParams.get('project_id')).toBe('proj-1');
    expect(cancelUrl.searchParams.get('invoice_id')).toBe('inv-1');
    expect(cancelUrl.searchParams.get('attempt_id')).toMatch(/^mobile_/);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
  });

  it('expires newly created Checkout Sessions after 30 minutes', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    await POST(request({ invoiceId: 'inv-1' }));

    const expiresAt = Number(requestBody().get('expires_at'));
    const expected = Math.floor(Date.now() / 1000) + 30 * 60;
    expect(expiresAt).toBeGreaterThanOrEqual(expected - 1);
    expect(expiresAt).toBeLessThanOrEqual(expected + 1);
  });

  it('copies invoice metadata onto the PaymentIntent for failed-payment webhooks', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(requestBody().get('metadata[invoiceId]')).toBe('inv-1');
    expect(requestBody().get('metadata[projectId]')).toBe('proj-1');
    expect(requestBody().get('payment_intent_data[metadata][invoiceId]')).toBe('inv-1');
    expect(requestBody().get('payment_intent_data[metadata][projectId]')).toBe('proj-1');
  });

  it('uses the claimed attempt as Stripe idempotency key', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    const headers = mocks.fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toMatch(/^clientflow:inv-1:mobile_/);
    expect(mocks.invoiceUpdateMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: expect.objectContaining({
        id: 'inv-1',
        stripeCheckoutAttemptId: null,
        stripeCheckoutSessionId: null,
      }),
      data: { stripeCheckoutAttemptId: expect.stringMatching(/^mobile_/) },
    }));
  });

  it('recovers an interrupted creation with the same stored Stripe idempotency key', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      stripeCheckoutAttemptId: 'mobile_recover-1',
    });
    mocks.fetch.mockResolvedValue(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    const headers = mocks.fetch.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['Idempotency-Key']).toBe('clientflow:inv-1:mobile_recover-1');
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceUpdateMany).toHaveBeenCalledWith({
      where: {
        id: 'inv-1',
        status: 'SENT',
        stripeCheckoutAttemptId: 'mobile_recover-1',
        stripeCheckoutSessionId: null,
      },
      data: { stripeCheckoutSessionId: 'cs-new', status: 'PAYMENT_PENDING' },
    });
  });

  it.each(['web', 'https://evil.example/return', null, 42] as const)(
    'rejects invalid returnTo value %s',
    async (returnTo) => {
      const response = await POST(request({ invoiceId: 'inv-1', returnTo }));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'returnTo must be "mobile" when provided' });
      expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
      expect(mocks.fetch).not.toHaveBeenCalled();
    },
  );

  it('reuses an existing web checkout session', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'web_attempt-1',
      stripeCheckoutSessionId: 'cs-existing',
    });
    mocks.fetch.mockResolvedValue(stripeResponse({
      id: 'cs-existing',
      url: 'https://checkout.stripe.test/cs-existing',
      status: 'open',
      payment_status: 'unpaid',
      success_url: 'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url:
        'https://app.clientflow.test/api/stripe/checkout/cancel?invoice_id=inv-1&attempt_id=web_attempt-1',
    }));

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-existing',
      checkoutUrl: 'https://checkout.stripe.test/cs-existing',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceUpdateMany).not.toHaveBeenCalled();
  });

  it('reuses an existing mobile checkout session only when its success URL matches the invoice', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'mobile_attempt-1',
      stripeCheckoutSessionId: 'cs-existing-mobile',
    });
    mocks.fetch.mockResolvedValue(stripeResponse({
      id: 'cs-existing-mobile',
      url: 'https://checkout.stripe.test/cs-existing-mobile',
      status: 'open',
      payment_status: 'unpaid',
      success_url:
        'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
      cancel_url:
        'https://app.clientflow.test/api/stripe/checkout/cancel?invoice_id=inv-1&attempt_id=mobile_attempt-1&return_to=mobile&project_id=proj-1',
    }));

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-existing-mobile',
      checkoutUrl: 'https://checkout.stripe.test/cs-existing-mobile',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceUpdateMany).not.toHaveBeenCalled();
  });

  it('creates a mobile session instead of reusing an existing web-only session', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'web_attempt-1',
      stripeCheckoutSessionId: 'cs-existing-web',
    });
    mocks.fetch
      .mockResolvedValueOnce(stripeResponse({
        id: 'cs-existing-web',
        url: 'https://checkout.stripe.test/cs-existing-web',
        status: 'open',
        payment_status: 'unpaid',
        success_url: 'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url:
          'https://app.clientflow.test/api/stripe/checkout/cancel?invoice_id=inv-1&attempt_id=web_attempt-1',
      }))
      .mockResolvedValueOnce(stripeResponse({ id: 'cs-existing-web', status: 'expired' }))
      .mockResolvedValueOnce(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(mocks.fetch.mock.calls[1]?.[0]).toBe(
      'https://api.stripe.com/v1/checkout/sessions/cs-existing-web/expire',
    );
    expect(requestBody(2).get('success_url')).toBe(
      'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    );
    expect(new URL(String(requestBody(2).get('cancel_url'))).pathname).toBe(
      '/api/stripe/checkout/cancel',
    );
  });

  it('replaces a mobile session when its cancel URL is still web-only', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'mobile_attempt-old',
      stripeCheckoutSessionId: 'cs-existing-mobile-with-web-cancel',
    });
    mocks.fetch
      .mockResolvedValueOnce(stripeResponse({
        url: 'https://checkout.stripe.test/cs-existing-mobile-with-web-cancel',
        status: 'open',
        payment_status: 'unpaid',
        success_url:
          'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
        cancel_url: 'https://app.clientflow.test/payment/cancelled',
      }))
      .mockResolvedValueOnce(stripeResponse({
        id: 'cs-existing-mobile-with-web-cancel',
        status: 'expired',
      }))
      .mockResolvedValueOnce(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(3);
    expect(new URL(String(requestBody(2).get('cancel_url'))).pathname).toBe(
      '/api/stripe/checkout/cancel',
    );
  });

  it('never reuses an expired Session when a failed invoice is retried', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'FAILED',
      stripeCheckoutAttemptId: 'mobile_expired-1',
      stripeCheckoutSessionId: 'cs-expired',
    });
    mocks.fetch
      .mockResolvedValueOnce(stripeResponse({
        id: 'cs-expired',
        status: 'expired',
        payment_status: 'unpaid',
        url: null,
      }))
      .mockResolvedValueOnce(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.fetch.mock.calls[1]?.[0]).toBe(
      'https://api.stripe.com/v1/checkout/sessions',
    );
  });

  it('settles an already-paid Stripe Session instead of creating another one', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      status: 'PAYMENT_PENDING',
      stripeCheckoutAttemptId: 'mobile_paid-1',
      stripeCheckoutSessionId: 'cs-paid',
    });
    mocks.fetch.mockResolvedValue(stripeResponse({
      id: 'cs-paid',
      status: 'complete',
      payment_status: 'paid',
      payment_intent: 'pi-paid',
    }));

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(409);
    expect(mocks.markInvoicePaid).toHaveBeenCalledWith('inv-1', {
      checkoutSessionId: 'cs-paid',
      paymentIntentId: 'pi-paid',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['PAID', 409, 'Invoice is already paid'],
    ['VOIDED', 409, 'Invoice cannot be paid'],
    ['REFUNDED', 409, 'Invoice cannot be paid'],
  ] as const)('preserves invoice state behavior for %s', async (status, expectedStatus, error) => {
    mocks.invoiceFindFirst.mockResolvedValue({ ...invoice, status });

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(expectedStatus);
    expect(await response.json()).toEqual({ error });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('does not open checkout for a draft invoice', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({ ...invoice, status: 'DRAFT' });

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Invoice cannot transition from DRAFT to PAYMENT_PENDING',
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.invoiceUpdateMany).not.toHaveBeenCalled();
  });

  it('returns 404 for a missing or non-owned invoice', async () => {
    mocks.invoiceFindFirst.mockResolvedValue(null);

    const response = await POST(request({ invoiceId: 'inv-unknown', returnTo: 'mobile' }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Invoice not found' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('returns 503 when Stripe is not configured', async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Stripe is not configured' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });
});
