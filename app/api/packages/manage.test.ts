import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    package: {
      create: mocks.create,
      update: mocks.update,
    },
  },
}));

import { POST } from './route';
import { PATCH } from './[id]/route';

const packageRecord = {
  id: 'pkg-new',
  name: 'Full Website',
  slug: 'full-website',
  description: 'A complete multi-page marketing site.',
  price: '6500.00',
  currency: 'usd',
  estimatedDuration: '6–8 weeks',
  sortOrder: 2,
};

function request(body: unknown, method = 'POST') {
  return new Request('http://localhost/api/packages', {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function params(id = 'pkg-new') {
  return { params: Promise.resolve({ id }) };
}

describe('package write endpoints', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a package with a major-unit price and serialized response', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.create.mockResolvedValue(packageRecord);

    const response = await POST(request({
      name: ' Full Website ',
      slug: 'FULL-WEBSITE',
      description: 'A complete multi-page marketing site.',
      price: '6500',
      currency: 'USD',
      estimatedDuration: '6–8 weeks',
      sortOrder: 2,
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: 'pkg-new',
      name: 'Full Website',
      slug: 'full-website',
      price: 6500,
      currency: 'usd',
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        name: 'Full Website',
        slug: 'full-website',
        description: 'A complete multi-page marketing site.',
        price: '6500.00',
        currency: 'usd',
        estimatedDuration: '6–8 weeks',
        sortOrder: 2,
        isActive: true,
      },
      select: expect.any(Object),
    });
  });

  it('returns 409 for a duplicate slug', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.create.mockRejectedValue({ code: 'P2002' });

    const response = await POST(request({
      name: 'Another Website',
      slug: 'full-website',
      description: 'Another package.',
      price: 1000,
      currency: 'usd',
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'A package with that slug already exists' });
  });

  it('deactivates a package without deleting it or touching historical records', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.update.mockResolvedValue({ ...packageRecord, isActive: false });

    const response = await PATCH(
      request({ isActive: false, price: '7000.00' }, 'PATCH'),
      params(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'pkg-new',
      price: 6500,
    });
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: 'pkg-new' },
      data: { isActive: false, price: '7000.00' },
      select: expect.any(Object),
    });
    // Package price is only edited on the package row. Existing project and
    // invoice rows are not queried or updated, so their historical amounts stay fixed.
  });

  it('returns 409 when changing to a duplicate slug', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.update.mockRejectedValue({ code: 'P2002' });

    const response = await PATCH(request({ slug: 'landing-page' }, 'PATCH'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'A package with that slug already exists' });
  });
});
