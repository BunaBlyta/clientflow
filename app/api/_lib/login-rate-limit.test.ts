import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  queryRaw: vi.fn(),
  executeRaw: vi.fn(),
}));

vi.mock('./prisma', () => ({
  prisma: {
    $queryRaw: mocks.queryRaw,
    $executeRaw: mocks.executeRaw,
  },
}));

import {
  clearLoginAccountRateLimit,
  consumeLoginRateLimit,
} from './login-rate-limit';

function request(ip = '203.0.113.10') {
  return new Request('http://localhost/api/auth/login', {
    headers: { 'x-forwarded-for': `${ip}, 10.0.0.1` },
  }) as unknown as NextRequest;
}

describe('login rate limiting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.queryRaw.mockImplementation(
      async (_strings: TemplateStringsArray, key: string) => [{
        key,
        count: 1,
        resetAt: new Date(Date.now() + 15 * 60 * 1000),
      }],
    );
    mocks.executeRaw.mockResolvedValue(1);
  });

  it('uses separate hashed account and IP buckets', async () => {
    const result = await consumeLoginRateLimit(request(), 'alex@example.com');

    expect(result).toEqual({ allowed: true, retryAfterSeconds: 0 });
    expect(mocks.queryRaw).toHaveBeenCalledTimes(2);

    const ipKey = mocks.queryRaw.mock.calls[0][1] as string;
    const accountKey = mocks.queryRaw.mock.calls[1][1] as string;
    expect(accountKey).toMatch(/^login:account:/);
    expect(ipKey).toMatch(/^login:ip:/);
    expect(accountKey).not.toContain('alex@example.com');
    expect(ipKey).not.toContain('203.0.113.10');
    expect(accountKey).not.toBe(ipKey);
  });

  it('blocks an account after ten attempts and rounds retry time to a minute', async () => {
    mocks.queryRaw.mockImplementation(
      async (_strings: TemplateStringsArray, key: string) => [{
        key,
        count: key.startsWith('login:account:') ? 11 : 1,
        resetAt: new Date(Date.now() + 61_000),
      }],
    );

    const result = await consumeLoginRateLimit(request(), 'alex@example.com');

    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(120);
  });

  it('stops at the IP bucket after thirty attempts', async () => {
    mocks.queryRaw.mockImplementation(
      async (_strings: TemplateStringsArray, key: string) => [{
        key,
        count: 31,
        resetAt: new Date(Date.now() + 15 * 60 * 1000),
      }],
    );

    const result = await consumeLoginRateLimit(request(), 'alex@example.com');

    expect(result.allowed).toBe(false);
    expect(mocks.queryRaw).toHaveBeenCalledTimes(1);
    expect(mocks.queryRaw.mock.calls[0][1]).toMatch(/^login:ip:/);
  });

  it('clears only the hashed account bucket after a successful login', async () => {
    await clearLoginAccountRateLimit('alex@example.com');

    expect(mocks.executeRaw).toHaveBeenCalledTimes(1);
    const key = mocks.executeRaw.mock.calls[0][1] as string;
    expect(key).toMatch(/^login:account:/);
    expect(key).not.toContain('alex@example.com');
  });
});
