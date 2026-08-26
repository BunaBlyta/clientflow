import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { user: { findUnique: mocks.findUnique } },
}));

vi.mock('@/app/api/_lib/verification-email', () => ({
  issueVerificationEmail: mocks.issueVerificationEmail,
}));

import { POST } from './route';

describe('POST /api/auth/verification/send', () => {
  it('rejects an unknown email so the client can explain that it is not registered', async () => {
    mocks.findUnique.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/api/auth/verification/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    }) as unknown as NextRequest);

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'No Clientflow account found for this email' });
    expect(mocks.issueVerificationEmail).not.toHaveBeenCalled();
  });

  it('sends a code for a registered email', async () => {
    const user = { id: 'user-1', name: 'Client User', email: 'client@example.com' };
    mocks.findUnique.mockResolvedValue(user);
    mocks.issueVerificationEmail.mockResolvedValue(undefined);

    const response = await POST(new Request('http://localhost/api/auth/verification/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    }) as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: true, registered: true });
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith(user);
  });

  it('still allows a registered user to continue when delivery reports an error', async () => {
    const user = { id: 'user-2', name: 'Client User', email: 'client@example.com' };
    mocks.findUnique.mockResolvedValue(user);
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));

    const response = await POST(new Request('http://localhost/api/auth/verification/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: user.email }),
    }) as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: false, registered: true });
  });
});
