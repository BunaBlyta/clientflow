import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => {
  const user = {
    id: 'user-1',
    email: 'alex@example.com',
    name: 'Alex Morgan',
    role: 'CLIENT' as const,
    createdAt: new Date('2026-08-12T08:00:00.000Z'),
    passwordHash: null as string | null,
    isActive: false,
    emailVerifiedAt: null as Date | null,
    verificationCodeHash: null as string | null,
    verificationCodeExpiresAt: null as Date | null,
  };

  return {
    user,
    sendVerificationEmail: vi.fn(),
    userFindUnique: vi.fn(async () => user),
    userUpdate: vi.fn(async ({ data }: { data: Partial<typeof user> }) => {
      Object.assign(user, data);
      return user;
    }),
  };
});

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: mocks.userFindUnique,
      update: mocks.userUpdate,
    },
  },
}));

vi.mock('@/app/api/_lib/resend', () => ({
  sendVerificationEmail: mocks.sendVerificationEmail,
}));

import { POST as login } from '../../login/route';
import { POST as setPassword } from '../../set-password/route';
import { POST as sendVerification } from '../send/route';
import { POST as verify } from './route';

function request(url: string, body: unknown) {
  return new Request(`http://localhost${url}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('client verification flow', () => {
  beforeEach(() => {
    mocks.user.passwordHash = null;
    mocks.user.isActive = false;
    mocks.user.emailVerifiedAt = null;
    mocks.user.verificationCodeHash = null;
    mocks.user.verificationCodeExpiresAt = null;
    mocks.sendVerificationEmail.mockReset();
    mocks.userFindUnique.mockClear();
    mocks.userUpdate.mockClear();
  });

  it('keeps the code available between verification and password setup', async () => {
    let deliveredCode = '';
    mocks.sendVerificationEmail.mockImplementation(async ({ code }: { code: string }) => {
      deliveredCode = code;
    });

    const sentResponse = await sendVerification(
      request('/api/auth/verification/send', { email: mocks.user.email }),
    );

    expect(sentResponse.status).toBe(200);
    expect(await sentResponse.json()).toEqual({ sent: true });
    expect(deliveredCode).toMatch(/^\d{6}$/);

    const codeHashBeforeCheck = mocks.user.verificationCodeHash;
    const codeExpiresAtBeforeCheck = mocks.user.verificationCodeExpiresAt;

    const verifiedResponse = await verify(
      request('/api/auth/verification/verify', {
        email: mocks.user.email,
        code: deliveredCode,
      }),
    );

    expect(verifiedResponse.status).toBe(200);
    expect(await verifiedResponse.json()).toMatchObject({
      verified: true,
      user: { id: mocks.user.id, email: mocks.user.email },
    });
    expect(mocks.user.emailVerifiedAt).toBeNull();
    expect(mocks.user.isActive).toBe(false);
    expect(mocks.user.verificationCodeHash).toBe(codeHashBeforeCheck);
    expect(mocks.user.verificationCodeExpiresAt).toBe(codeExpiresAtBeforeCheck);

    const passwordResponse = await setPassword(
      request('/api/auth/set-password', {
        email: mocks.user.email,
        code: deliveredCode,
        password: 'strong-password',
      }),
    );

    expect(passwordResponse.status).toBe(200);
    expect(await passwordResponse.json()).toMatchObject({
      user: { id: mocks.user.id, email: mocks.user.email },
    });
    expect(mocks.user.isActive).toBe(true);
    expect(mocks.user.emailVerifiedAt).toBeInstanceOf(Date);
    expect(mocks.user.passwordHash).toMatch(/^scrypt:/);
    expect(mocks.user.verificationCodeHash).toBeNull();
    expect(mocks.user.verificationCodeExpiresAt).toBeNull();

    const loginResponse = await login(
      request('/api/auth/login', {
        email: mocks.user.email,
        password: 'strong-password',
      }),
    );

    expect(loginResponse.status).toBe(200);
    expect(await loginResponse.json()).toMatchObject({
      user: { id: mocks.user.id, email: mocks.user.email },
      token: expect.any(String),
    });
  });
});
