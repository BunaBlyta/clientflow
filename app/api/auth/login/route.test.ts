import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  createSessionToken: vi.fn(),
  verifyPassword: vi.fn(),
  consumeRateLimit: vi.fn(),
  clearAccountRateLimit: vi.fn(),
  findUser: vi.fn(),
  findClient: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  SESSION_COOKIE: 'clientflow_session',
  createSessionToken: mocks.createSessionToken,
  verifyPassword: mocks.verifyPassword,
}));

vi.mock('@/app/api/_lib/login-rate-limit', () => ({
  consumeLoginRateLimit: mocks.consumeRateLimit,
  clearLoginAccountRateLimit: mocks.clearAccountRateLimit,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    user: { findUnique: mocks.findUser },
    client: { findUnique: mocks.findClient },
  },
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.10',
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.consumeRateLimit.mockResolvedValue({ allowed: true, retryAfterSeconds: 0 });
    mocks.clearAccountRateLimit.mockResolvedValue(undefined);
    mocks.createSessionToken.mockReturnValue('session-token');
  });

  it('checks both login limits before looking up a user', async () => {
    mocks.consumeRateLimit.mockResolvedValue({ allowed: false, retryAfterSeconds: 180 });

    const response = await POST(request({ email: 'Alex@Example.com ', password: 'password' }));

    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('180');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toEqual({
      error: 'Too many login attempts. Please try again later.',
    });
    expect(mocks.consumeRateLimit).toHaveBeenCalledWith(
      expect.anything(),
      'alex@example.com',
    );
    expect(mocks.findUser).not.toHaveBeenCalled();
  });

  it('keeps invalid credentials generic and retains the failed-attempt count', async () => {
    mocks.findUser.mockResolvedValue(null);

    const response = await POST(request({ email: 'missing@example.com', password: 'wrong' }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Invalid email or password' });
    expect(mocks.clearAccountRateLimit).not.toHaveBeenCalled();
  });

  it('clears the account bucket after a successful staff login', async () => {
    mocks.findUser.mockResolvedValue({
      id: 'staff-1',
      email: 'staff@example.com',
      name: 'Staff User',
      role: 'STAFF',
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
      passwordHash: 'scrypt:stored',
      isActive: true,
    });
    mocks.verifyPassword.mockReturnValue(true);

    const response = await POST(request({ email: 'STAFF@example.com', password: 'correct' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      token: 'session-token',
      user: { id: 'staff-1', role: 'STAFF' },
    });
    expect(mocks.clearAccountRateLimit).toHaveBeenCalledWith('staff@example.com');
    expect(response.cookies.get('clientflow_session')?.value).toBe('session-token');
  });
});
