import { describe, expect, it } from 'vitest';
import {
  canTransitionInvoiceStatus,
  transitionInvoiceStatus,
} from './invoice-state';

describe('invoice state transitions', () => {
  it('allows the normal payment lifecycle', () => {
    expect(canTransitionInvoiceStatus('DRAFT', 'SENT')).toBe(true);
    expect(canTransitionInvoiceStatus('SENT', 'PAYMENT_PENDING')).toBe(true);
    expect(canTransitionInvoiceStatus('PAYMENT_PENDING', 'PAID')).toBe(true);
    expect(canTransitionInvoiceStatus('PAID', 'REFUNDED')).toBe(true);
  });

  it('allows a failed payment to be retried', () => {
    expect(canTransitionInvoiceStatus('PAYMENT_PENDING', 'FAILED')).toBe(true);
    expect(canTransitionInvoiceStatus('FAILED', 'PAYMENT_PENDING')).toBe(true);
  });

  it('rejects skipping payment states or changing terminal states', () => {
    expect(canTransitionInvoiceStatus('DRAFT', 'PAID')).toBe(false);
    expect(canTransitionInvoiceStatus('SENT', 'PAID')).toBe(false);
    expect(canTransitionInvoiceStatus('VOIDED', 'SENT')).toBe(false);
    expect(canTransitionInvoiceStatus('REFUNDED', 'PAID')).toBe(false);
  });

  it('returns the new state and throws for an invalid transition', () => {
    expect(transitionInvoiceStatus('PAYMENT_PENDING', 'PAID')).toBe('PAID');
    expect(() => transitionInvoiceStatus('PAID', 'VOIDED')).toThrow(
      'Invoice cannot transition from PAID to VOIDED',
    );
  });
});
