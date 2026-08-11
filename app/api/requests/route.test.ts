import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    package: { findFirst: mocks.findFirst },
    projectRequest: { findMany: mocks.findMany, create: mocks.create },
  },
}));

import { POST } from './route';

function request(body: unknown) {
  return new Request('http://localhost/api/requests', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('POST /api/requests', () => {
  beforeEach(() => vi.clearAllMocks());

  it('creates a pending request for an active package', async () => {
    mocks.findFirst.mockResolvedValue({ id: 'pkg-1' });
    mocks.create.mockResolvedValue({
      id: 'req-1',
      packageId: 'pkg-1',
      name: 'Alex Morgan',
      email: 'alex@example.com',
      companyName: 'Alex Studio',
      message: 'Build us a new site.',
      status: 'PENDING',
      createdAt: new Date('2026-08-11T10:00:00.000Z'),
      reviewedAt: null,
    });

    const response = await POST(request({
      name: ' Alex Morgan ',
      email: ' ALEX@example.com ',
      packageId: 'pkg-1',
      companyName: 'Alex Studio',
      message: 'Build us a new site.',
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      id: 'req-1',
      prospectName: 'Alex Morgan',
      prospectEmail: 'alex@example.com',
      status: 'PENDING',
    });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: 'pkg-1', isActive: true },
      select: { id: true },
    });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        packageId: 'pkg-1',
        companyName: 'Alex Studio',
        message: 'Build us a new site.',
      },
    }));
  });

  it('rejects an unknown or inactive package without creating a request', async () => {
    mocks.findFirst.mockResolvedValue(null);

    const response = await POST(request({
      name: 'Alex Morgan',
      email: 'alex@example.com',
      packageId: 'inactive-package',
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'Package not found or inactive' });
    expect(mocks.create).not.toHaveBeenCalled();
  });
});
