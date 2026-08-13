import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
  transactionCreate: vi.fn(),
  staffFindMany: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: vi.fn(),
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    package: { findFirst: mocks.findFirst },
    projectRequest: { findMany: mocks.findMany, create: mocks.create },
    $transaction: mocks.transaction,
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
    mocks.findFirst.mockResolvedValue({ id: 'pkg-1', name: 'Full Website' });
    mocks.transactionCreate.mockResolvedValue({
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
    mocks.staffFindMany.mockResolvedValue([{ id: 'staff-1' }, { id: 'staff-2' }]);
    mocks.transaction.mockImplementation(async (callback) => callback({
      projectRequest: { create: mocks.transactionCreate },
      user: { findMany: mocks.staffFindMany },
      notification: { create: mocks.notificationCreate },
    }));

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
      select: { id: true, name: true },
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.transactionCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: {
        name: 'Alex Morgan',
        email: 'alex@example.com',
        packageId: 'pkg-1',
        companyName: 'Alex Studio',
        message: 'Build us a new site.',
      },
    }));
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationCreate).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 'staff-1',
        type: 'REQUEST_SUBMITTED',
        requestId: 'req-1',
        title: 'New project request',
        message: 'Alex Morgan from Alex Studio requested a Full Website.',
      },
    });
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
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
