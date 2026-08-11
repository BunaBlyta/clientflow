import { describe, expect, it } from 'vitest';
import { stripeSignature, verifyStripeSignature } from './stripe';

describe('Stripe webhook signatures', () => {
  it('accepts a current signature and rejects tampering', () => {
    const payload = JSON.stringify({ id: 'evt_test' });
    const secret = 'whsec_test';
    const timestamp = 1_700_000_000;
    const signature = stripeSignature(payload, secret, timestamp);

    expect(verifyStripeSignature(payload, signature, secret, timestamp)).toBe(true);
    expect(verifyStripeSignature(`${payload}.tampered`, signature, secret, timestamp)).toBe(false);
  });

  it('rejects signatures outside the replay tolerance window', () => {
    const payload = '{}';
    const signature = stripeSignature(payload, 'whsec_test', 1_700_000_000);

    expect(verifyStripeSignature(payload, signature, 'whsec_test', 1_700_000_301)).toBe(false);
  });
});

