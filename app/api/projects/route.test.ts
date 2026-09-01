import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
  count: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    project: { findMany: mocks.findMany, count: mocks.count },
  },
}));

import { GET } from './route';

describe('GET /api/projects', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps packageId and adds the serialized package summary', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findMany.mockResolvedValue([
      {
        id: 'proj-1',
        clientId: 'client-1',
        packageId: 'pkg-full-website',
        package: {
          id: 'pkg-full-website',
          name: 'Full Website',
          price: { toString: () => '6500.00' },
          currency: 'usd',
        },
        name: 'Riverside Cafe — Full Website',
        status: 'DEVELOPMENT',
        createdAt: new Date('2026-06-02T14:00:00.000Z'),
        updatedAt: new Date('2026-08-11T10:00:00.000Z'),
        targetLaunchDate: null,
      },
    ]);

    const response = await GET(new Request('http://localhost/api/projects') as unknown as NextRequest);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'proj-1',
        clientId: 'client-1',
        packageId: 'pkg-full-website',
        package: {
          id: 'pkg-full-website',
          name: 'Full Website',
          price: 6500,
          currency: 'usd',
        },
        name: 'Riverside Cafe — Full Website',
        status: 'DEVELOPMENT',
        createdAt: '2026-06-02T14:00:00.000Z',
        updatedAt: '2026-08-11T10:00:00.000Z',
      },
    ]);
  });

  it('returns a paginated envelope when page parameters are provided', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findMany.mockResolvedValue([]);
    mocks.count.mockResolvedValue(41);

    const response = await GET(
      new Request('http://localhost/api/projects?page=2&pageSize=20&search=river&status=DEVELOPMENT') as unknown as NextRequest,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [],
      page: 2,
      pageSize: 20,
      totalItems: 41,
      totalPages: 3,
      hasMore: true,
    });
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        name: { contains: 'river', mode: 'insensitive' },
        status: 'DEVELOPMENT',
      },
      skip: 20,
      take: 20,
    }));
    expect(mocks.count).toHaveBeenCalledWith({
      where: {
        name: { contains: 'river', mode: 'insensitive' },
        status: 'DEVELOPMENT',
      },
    });
  });
});
