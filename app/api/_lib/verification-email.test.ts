import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { user: { update: vi.fn() } },
}));

vi.mock('@/app/api/_lib/resend', () => ({
  sendVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/verification', () => ({
  createVerificationCode: vi.fn(),
}));

import { buildAcceptInviteUrl } from './verification-email';

describe('buildAcceptInviteUrl', () => {
  afterEach(() => {
    delete process.env.APP_URL;
  });

  it('uses APP_URL as the canonical invitation origin', () => {
    process.env.APP_URL = 'https://app.clientflow.example/';

    expect(buildAcceptInviteUrl('staff@example.com', 'http://localhost:3000')).toBe(
      'https://app.clientflow.example/accept-invite?email=staff%40example.com',
    );
  });

  it('falls back to the request origin when APP_URL is not configured', () => {
    expect(buildAcceptInviteUrl('staff@example.com', 'http://localhost:3000')).toBe(
      'http://localhost:3000/accept-invite?email=staff%40example.com',
    );
  });
});
