import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  clientFindUnique: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { client: { findUnique: mocks.clientFindUnique } },
}));

import { GET } from './route';

function request() {
  return new Request('http://localhost/api/auth/me') as unknown as NextRequest;
}

describe('GET /api/auth/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns an empty 401 response without a valid session', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await GET(request());

    expect(response.status).toBe(401);
    expect(await response.text()).toBe('');
  });

  it('returns staff identity without a client ID', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'staff-1',
      name: 'Sam Torres',
      email: 'sam@clientflow.studio',
      role: 'STAFF',
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'staff-1',
      name: 'Sam Torres',
      email: 'sam@clientflow.studio',
      role: 'STAFF',
    });
    expect(mocks.clientFindUnique).not.toHaveBeenCalled();
  });

  it('returns the client identity and linked client ID', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'user-client-1',
      name: 'Jordan Ellis',
      email: 'jordan@riversidecoffee.com',
      role: 'CLIENT',
    });
    mocks.clientFindUnique.mockResolvedValue({ id: 'client-1' });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'user-client-1',
      name: 'Jordan Ellis',
      email: 'jordan@riversidecoffee.com',
      role: 'CLIENT',
      clientId: 'client-1',
    });
    expect(mocks.clientFindUnique).toHaveBeenCalledWith({
      where: { userId: 'user-client-1' },
      select: { id: true },
    });
  });
});
