import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  invoiceFindFirst: vi.fn(),
  markInvoicePaid: vi.fn(),
  markInvoiceFailed: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { invoice: { findFirst: mocks.invoiceFindFirst } },
}));

vi.mock('@/app/api/_lib/invoice-payments', () => ({
  markInvoicePaid: mocks.markInvoicePaid,
  markInvoiceFailed: mocks.markInvoiceFailed,
}));

import { GET } from './route';

function request(query: string) {
  return new NextRequest(`https://app.clientflow.test/api/stripe/checkout/cancel?${query}`);
}

function stripeResponse(body: unknown, ok = true, status = ok ? 200 : 409) {
  return { ok, status, json: vi.fn().mockResolvedValue(body) };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  vi.stubGlobal('fetch', mocks.fetch);
  mocks.invoiceFindFirst.mockResolvedValue({
    id: 'inv-1',
    status: 'PAYMENT_PENDING',
    stripeCheckoutSessionId: 'cs-open',
  });
  mocks.markInvoicePaid.mockResolvedValue(true);
  mocks.markInvoiceFailed.mockResolvedValue(true);
});

describe('GET /api/stripe/checkout/cancel', () => {
  it('expires the current open Session, marks the attempt failed, and returns to mobile', async () => {
    mocks.fetch
      .mockResolvedValueOnce(stripeResponse({
        id: 'cs-open',
        status: 'open',
        payment_status: 'unpaid',
        payment_intent: 'pi-1',
      }))
      .mockResolvedValueOnce(stripeResponse({
        id: 'cs-open',
        status: 'expired',
        payment_intent: 'pi-1',
      }));

    const response = await GET(request(
      'invoice_id=inv-1&attempt_id=mobile_attempt-1&return_to=mobile&project_id=proj-1',
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://app.clientflow.test/payment/cancelled?return_to=mobile&project_id=proj-1&invoice_id=inv-1',
    );
    expect(mocks.invoiceFindFirst).toHaveBeenCalledWith({
      where: { id: 'inv-1', stripeCheckoutAttemptId: 'mobile_attempt-1' },
      select: { id: true, status: true, stripeCheckoutSessionId: true },
    });
    expect(mocks.fetch.mock.calls[1]?.[0]).toBe(
      'https://api.stripe.com/v1/checkout/sessions/cs-open/expire',
    );
    expect(mocks.markInvoiceFailed).toHaveBeenCalledWith('inv-1', {
      paymentIntentId: 'pi-1',
    });
  });

  it('cannot cancel a newer Session with a stale attempt ID', async () => {
    mocks.invoiceFindFirst.mockResolvedValue(null);

    const response = await GET(request('invoice_id=inv-1&attempt_id=mobile_stale'));

    expect(response.status).toBe(307);
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.markInvoiceFailed).not.toHaveBeenCalled();
  });

  it('settles a paid Session instead of cancelling it', async () => {
    mocks.fetch.mockResolvedValue(stripeResponse({
      id: 'cs-open',
      status: 'complete',
      payment_status: 'paid',
      payment_intent: 'pi-paid',
    }));

    const response = await GET(request(
      'invoice_id=inv-1&attempt_id=web_attempt-1',
    ));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://app.clientflow.test/payment/success',
    );
    expect(mocks.markInvoicePaid).toHaveBeenCalledWith('inv-1', {
      checkoutSessionId: 'cs-open',
      paymentIntentId: 'pi-paid',
    });
    expect(mocks.markInvoiceFailed).not.toHaveBeenCalled();
  });

  it('leaves a completed delayed payment pending', async () => {
    mocks.fetch.mockResolvedValue(stripeResponse({
      id: 'cs-open',
      status: 'complete',
      payment_status: 'unpaid',
      payment_intent: 'pi-processing',
    }));

    const response = await GET(request(
      'invoice_id=inv-1&attempt_id=web_attempt-1',
    ));

    expect(response.status).toBe(307);
    expect(mocks.markInvoicePaid).not.toHaveBeenCalled();
    expect(mocks.markInvoiceFailed).not.toHaveBeenCalled();
    expect(mocks.fetch).toHaveBeenCalledTimes(1);
  });
});
