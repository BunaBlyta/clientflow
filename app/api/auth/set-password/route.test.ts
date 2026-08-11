import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findUnique: vi.fn(),
  update: vi.fn(),
  verifyCode: vi.fn(),
  hashPassword: vi.fn(),
  createSessionToken: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  SESSION_COOKIE: 'clientflow_session',
  createSessionToken: mocks.createSessionToken,
  hashPassword: mocks.hashPassword,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
  },
}));

vi.mock('@/app/api/_lib/verification', () => ({
  verifyCode: mocks.verifyCode,
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/auth/set-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/auth/set-password', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an expired code without setting a password', async () => {
    mocks.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex Morgan',
      role: 'CLIENT',
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
      verificationCodeHash: 'scrypt:hash',
      verificationCodeExpiresAt: new Date('2026-08-11T09:00:00.000Z'),
    });

    const response = await POST(request({
      email: 'alex@example.com',
      code: '123456',
      password: 'strong-password',
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Invalid or expired verification code' });
    expect(mocks.verifyCode).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('re-validates the code before setting the password and returning a session', async () => {
    const expiresAt = new Date(Date.now() + 60_000);
    mocks.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex Morgan',
      role: 'CLIENT',
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
      verificationCodeHash: 'scrypt:hash',
      verificationCodeExpiresAt: expiresAt,
    });
    mocks.verifyCode.mockReturnValue(true);
    mocks.hashPassword.mockReturnValue('scrypt:new-password-hash');
    mocks.update.mockResolvedValue({
      id: 'user-1',
      email: 'alex@example.com',
      name: 'Alex Morgan',
      role: 'CLIENT',
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
    });
    mocks.createSessionToken.mockReturnValue('session-token');

    const response = await POST(request({
      email: 'alex@example.com',
      code: '123456',
      password: 'strong-password',
    }));

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      token: 'session-token',
      user: { id: 'user-1', role: 'CLIENT' },
    });
    expect(mocks.verifyCode).toHaveBeenCalledWith('123456', 'scrypt:hash');
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'user-1' },
      data: expect.objectContaining({
        passwordHash: 'scrypt:new-password-hash',
        isActive: true,
        verificationCodeHash: null,
        verificationCodeExpiresAt: null,
      }),
    }));
  });
});
