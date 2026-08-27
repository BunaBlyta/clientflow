import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
  verifyPassword: mocks.verifyPassword,
  hashPassword: mocks.hashPassword,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { user: { findUnique: mocks.findUnique, update: mocks.update } },
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/auth/change-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authenticate.mockResolvedValue({
      id: 'user-1', name: 'Alex', email: 'alex@example.com', role: 'CLIENT',
    });
  });

  it('returns 401 without a valid session', async () => {
    mocks.authenticate.mockResolvedValue(null);
    const response = await POST(request({ currentPassword: 'old-password', newPassword: 'new-password' }));
    expect(response.status).toBe(401);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects a new password shorter than 8 characters', async () => {
    const response = await POST(request({ currentPassword: 'old-password', newPassword: 'short' }));
    expect(response.status).toBe(400);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects a new password identical to the current one', async () => {
    const response = await POST(request({ currentPassword: 'same-password', newPassword: 'same-password' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'New password must be different from the current one',
    });
  });

  it('rejects an incorrect current password without updating', async () => {
    mocks.findUnique.mockResolvedValue({ passwordHash: 'scrypt:stored' });
    mocks.verifyPassword.mockReturnValue(false);

    const response = await POST(request({ currentPassword: 'wrong-password', newPassword: 'new-password' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Current password is incorrect' });
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rehashes and stores the new password when the current one checks out', async () => {
    mocks.findUnique.mockResolvedValue({ passwordHash: 'scrypt:stored' });
    mocks.verifyPassword.mockReturnValue(true);
    mocks.hashPassword.mockReturnValue('scrypt:new-hash');
    mocks.update.mockResolvedValue({ id: 'user-1' });

    const response = await POST(request({ currentPassword: 'old-password', newPassword: 'new-password' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ success: true });
    expect(mocks.verifyPassword).toHaveBeenCalledWith('old-password', 'scrypt:stored');
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { passwordHash: 'scrypt:new-hash' },
    });
  });
});
