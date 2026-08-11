import { describe, expect, it } from 'vitest';
import { serializeInvoice } from './serialize';

describe('invoice API response mapping', () => {
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
