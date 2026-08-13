import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  invoiceFindFirst: vi.fn(),
  invoiceUpdate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    invoice: {
      findFirst: mocks.invoiceFindFirst,
      update: mocks.invoiceUpdate,
    },
  },
}));

import { POST } from './route';

const invoice = {
  id: 'inv-1',
  projectId: 'proj-1',
  description: 'Deposit — Full Website',
  amount: '3250.00',
  currency: 'usd',
  status: 'SENT',
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
  mocks.invoiceUpdate.mockResolvedValue({});
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
    expect(requestBody().get('cancel_url')).toBe('https://app.clientflow.test/payment/cancelled');
  });

  it('constructs the fixed mobile success URL when returnTo is mobile', async () => {
    mocks.fetch.mockResolvedValue(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(requestBody().get('success_url')).toBe(
      'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    );
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
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
      stripeCheckoutSessionId: 'cs-existing',
    });
    mocks.fetch.mockResolvedValue(stripeResponse({
      url: 'https://checkout.stripe.test/cs-existing',
      success_url: 'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}',
    }));

    const response = await POST(request({ invoiceId: 'inv-1' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-existing',
      checkoutUrl: 'https://checkout.stripe.test/cs-existing',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceUpdate).not.toHaveBeenCalled();
  });

  it('reuses an existing mobile checkout session only when its success URL matches the invoice', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      stripeCheckoutSessionId: 'cs-existing-mobile',
    });
    mocks.fetch.mockResolvedValue(stripeResponse({
      url: 'https://checkout.stripe.test/cs-existing-mobile',
      success_url:
        'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    }));

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-existing-mobile',
      checkoutUrl: 'https://checkout.stripe.test/cs-existing-mobile',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceUpdate).not.toHaveBeenCalled();
  });

  it('creates a mobile session instead of reusing an existing web-only session', async () => {
    mocks.invoiceFindFirst.mockResolvedValue({
      ...invoice,
      stripeCheckoutSessionId: 'cs-existing-web',
    });
    mocks.fetch
      .mockResolvedValueOnce(stripeResponse({
        url: 'https://checkout.stripe.test/cs-existing-web',
        success_url: 'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}',
      }))
      .mockResolvedValueOnce(createSessionResponse());

    const response = await POST(request({ invoiceId: 'inv-1', returnTo: 'mobile' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      checkoutSessionId: 'cs-new',
      checkoutUrl: 'https://checkout.stripe.test/cs-new',
    });
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(requestBody(1).get('success_url')).toBe(
      'https://app.clientflow.test/payment/success?session_id={CHECKOUT_SESSION_ID}&return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    );
    expect(mocks.invoiceUpdate).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { stripeCheckoutSessionId: 'cs-new', status: 'PAYMENT_PENDING' },
    });
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
