import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    project: { findMany: mocks.findMany },
  },
}));

import { GET } from './route';

describe('GET /api/projects', () => {
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
});
