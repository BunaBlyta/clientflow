import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    package: { findMany: mocks.findMany },
  },
}));

import { GET } from './route';

describe('GET /api/packages', () => {
  it('returns active packages in sort order with JSON-safe prices', async () => {
    mocks.findMany.mockResolvedValue([
      {
        id: 'pkg-landing-page',
        name: 'Landing Page',
        slug: 'landing-page',
        description: 'A single high-converting page.',
        price: { toString: () => '2500.00' },
        currency: 'usd',
        estimatedDuration: '2–3 weeks',
        sortOrder: 1,
      },
      {
        id: 'pkg-full-website',
        name: 'Full Website',
        slug: 'full-website',
        description: 'A complete multi-page marketing site.',
        price: '6500.00',
        currency: 'usd',
        estimatedDuration: '6–8 weeks',
        sortOrder: 2,
      },
    ]);

    const response = await GET();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'pkg-landing-page',
        name: 'Landing Page',
        slug: 'landing-page',
        description: 'A single high-converting page.',
        price: 2500,
        currency: 'usd',
        estimatedDuration: '2–3 weeks',
        sortOrder: 1,
      },
      {
        id: 'pkg-full-website',
        name: 'Full Website',
        slug: 'full-website',
        description: 'A complete multi-page marketing site.',
        price: 6500,
        currency: 'usd',
        estimatedDuration: '6–8 weeks',
        sortOrder: 2,
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        price: true,
        currency: true,
        estimatedDuration: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });
  });
});
