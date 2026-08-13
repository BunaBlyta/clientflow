import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  transaction: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({ prisma: { $transaction: mocks.transaction } }));
vi.mock('@/app/api/_lib/verification-email', () => ({ issueVerificationEmail: mocks.issueVerificationEmail }));

import { POST } from './route';

const lead = {
  id: 'lead-1',
  name: 'Ava Marlowe',
  email: 'ava@example.com',
  message: 'We need a client portal.',
};
const client = {
  id: 'client-1',
  userId: 'user-client-1',
  name: 'Ava Marlowe',
  email: 'ava@example.com',
  companyName: 'Marlowe Studio',
  phone: null,
  createdAt: new Date('2026-08-13T10:02:00.000Z'),
};
const project = {
  id: 'project-1',
  clientId: 'client-1',
  packageId: null,
  name: 'Marlowe client portal',
  status: 'PENDING',
  createdAt: new Date('2026-08-13T10:02:00.000Z'),
  updatedAt: new Date('2026-08-13T10:02:00.000Z'),
};
const invoice = {
  id: 'invoice-1',
  projectId: 'project-1',
  clientId: 'client-1',
  type: 'CUSTOM',
  description: 'Custom project invoice',
  amount: { toString: () => '12000.00' },
  status: 'SENT',
  dueDate: null,
  paidAt: null,
  createdAt: new Date('2026-08-13T10:02:00.000Z'),
};

function request(body: unknown) {
  return new Request('http://localhost/api/contact-leads/lead-1/convert', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function transaction() {
  return {
    contactLead: { findUnique: vi.fn().mockResolvedValue(lead) },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue({ id: client.userId }),
    },
    client: { create: vi.fn().mockResolvedValue(client) },
    project: { create: vi.fn().mockResolvedValue(project) },
    invoice: { create: vi.fn().mockResolvedValue(invoice) },
    notification: { create: vi.fn().mockResolvedValue({}) },
  };
}

describe('POST /api/contact-leads/:id/convert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.issueVerificationEmail.mockResolvedValue(undefined);
  });

  it('requires staff access', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });

    const response = await POST(request({ projectName: 'Portal', amount: 12000, currency: 'usd' }), { params: Promise.resolve({ id: 'lead-1' }) });

    expect(response.status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('creates a client, custom project, sent invoice, and invitation', async () => {
    const tx = transaction();
    mocks.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));

    const response = await POST(request({
      companyName: 'Marlowe Studio',
      projectName: 'Marlowe client portal',
      description: 'A portal for customers.',
      amount: '12000',
      currency: 'USD',
      sendInvoice: true,
    }), { params: Promise.resolve({ id: 'lead-1' }) });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      client: { id: 'client-1', email: 'ava@example.com' },
      project: { id: 'project-1', packageId: null, status: 'PENDING' },
      invoice: { id: 'invoice-1', kind: 'CUSTOM', status: 'SENT', amountCents: 1200000 },
      emailSent: true,
    });
    expect(tx.project.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ clientId: 'client-1', status: 'PENDING' }),
    }));
    expect(tx.invoice.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ type: 'CUSTOM', status: 'SENT' }),
    }));
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith({
      id: 'user-client-1',
      email: 'ava@example.com',
      name: 'Ava Marlowe',
    });
  });

  it('keeps created records when the client invitation email fails', async () => {
    const tx = transaction();
    mocks.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const response = await POST(request({ projectName: 'Portal', amount: 12000, currency: 'usd' }), { params: Promise.resolve({ id: 'lead-1' }) });

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({ emailSent: false, client: { id: 'client-1' } });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('rejects an inquiry whose email belongs to a staff account', async () => {
    const tx = transaction();
    tx.user.findUnique.mockResolvedValue({ id: 'staff-2', role: 'STAFF', isActive: true, client: null });
    mocks.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));

    const response = await POST(request({ projectName: 'Portal', amount: 12000, currency: 'usd' }), { params: Promise.resolve({ id: 'lead-1' }) });

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'A staff account already uses this inquiry email' });
    expect(tx.project.create).not.toHaveBeenCalled();
  });

  it('returns 404 when the inquiry no longer exists', async () => {
    const tx = transaction();
    tx.contactLead.findUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback: (transaction: typeof tx) => unknown) => callback(tx));

    const response = await POST(request({ projectName: 'Portal', amount: 12000, currency: 'usd' }), { params: Promise.resolve({ id: 'missing' }) });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Custom inquiry not found' });
  });
});
