import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  clientFindUnique: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { client: { findUnique: mocks.clientFindUnique } },
}));

vi.mock('@/app/api/_lib/verification-email', () => ({
  issueVerificationEmail: mocks.issueVerificationEmail,
}));

import { POST } from './route';

function request() {
  return new Request('http://localhost/api/clients/client-1/resend-invitation', {
    method: 'POST',
  }) as unknown as NextRequest;
}

function params(id = 'client-1') {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/clients/:id/resend-invitation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('refuses clients before looking up another client', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });

    const response = await POST(request(), params());

    expect(response.status).toBe(403);
    expect(mocks.clientFindUnique).not.toHaveBeenCalled();
  });

  it('resends a verification email for a known client', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.clientFindUnique.mockResolvedValue({
      user: { id: 'user-client-1', email: 'jordan@example.com', name: 'Jordan Ellis' },
    });
    mocks.issueVerificationEmail.mockResolvedValue(undefined);

    const response = await POST(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ emailSent: true });
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith({
      id: 'user-client-1',
      email: 'jordan@example.com',
      name: 'Jordan Ellis',
    });
  });

  it('distinguishes a known client whose email could not be sent', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.clientFindUnique.mockResolvedValue({
      user: { id: 'user-client-1', email: 'jordan@example.com', name: 'Jordan Ellis' },
    });
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));

    const response = await POST(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ emailSent: false });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('returns 404 for an unknown client', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.clientFindUnique.mockResolvedValue(null);

    const response = await POST(request(), params('missing'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Client not found' });
    expect(mocks.issueVerificationEmail).not.toHaveBeenCalled();
  });
});
