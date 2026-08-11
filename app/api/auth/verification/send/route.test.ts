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
  it('returns the generic success response for an unknown email', async () => {
    mocks.findUnique.mockResolvedValue(null);

    const response = await POST(new Request('http://localhost/api/auth/verification/send', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'unknown@example.com' }),
    }) as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: true });
    expect(mocks.issueVerificationEmail).not.toHaveBeenCalled();
  });
});
