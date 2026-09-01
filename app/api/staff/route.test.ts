import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { user: { findMany: mocks.findMany } },
}));

import { GET } from './route';

const staffUser = {
  id: 'staff-2',
  email: 'jordan@example.com',
  name: 'Jordan Ellis',
  role: 'STAFF' as const,
  teamRole: 'USER' as const,
  isActive: false,
  createdAt: new Date('2026-08-13T09:00:00.000Z'),
};

function request() {
  return new Request('http://localhost/api/staff') as unknown as NextRequest;
}

describe('GET /api/staff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for an unauthenticated request', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('returns 403 for a client request', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });

    const response = await GET(request());

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('returns staff users without sensitive fields in creation order', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findMany.mockResolvedValue([staffUser]);

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'staff-2',
        email: 'jordan@example.com',
        name: 'Jordan Ellis',
        role: 'STAFF',
        teamRole: 'USER',
        isActive: false,
        createdAt: '2026-08-13T09:00:00.000Z',
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { role: 'STAFF' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        teamRole: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});
