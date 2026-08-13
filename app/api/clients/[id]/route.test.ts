import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findFirst: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { client: { findFirst: mocks.findFirst } },
}));

import { GET } from './route';

const client = {
  id: 'client-1',
  userId: 'user-1',
  name: 'Jordan Ellis',
  email: 'jordan@example.com',
  companyName: 'Riverside Coffee',
  phone: null,
  createdAt: new Date('2026-06-01T09:00:00.000Z'),
  projects: [{
    id: 'project-1',
    clientId: 'client-1',
    packageId: 'pkg-1',
    package: { id: 'pkg-1', name: 'Full Website', price: '6500.00', currency: 'usd' },
    name: 'Riverside Coffee — Full Website',
    status: 'DEVELOPMENT',
    createdAt: new Date('2026-06-02T09:00:00.000Z'),
    updatedAt: new Date('2026-08-12T09:00:00.000Z'),
    targetLaunchDate: null,
  }],
  invoices: [{
    id: 'invoice-1',
    projectId: 'project-1',
    clientId: 'client-1',
    type: 'DEPOSIT',
    description: 'Deposit — Full Website',
    amount: '3250.00',
    status: 'PAID',
    dueDate: null,
    paidAt: new Date('2026-06-03T09:00:00.000Z'),
    createdAt: new Date('2026-06-02T09:00:00.000Z'),
  }],
};

function request() {
  return new Request('http://localhost/api/clients/client-1') as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'client-1' }) };
}

describe('GET /api/clients/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires authentication', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await GET(request(), params());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('returns a client together with all projects and invoices', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findFirst.mockResolvedValue(client);

    const response = await GET(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'client-1',
      userId: 'user-1',
      companyName: 'Riverside Coffee',
      contactName: 'Jordan Ellis',
      email: 'jordan@example.com',
      createdAt: '2026-06-01T09:00:00.000Z',
      projects: [{
        id: 'project-1',
        clientId: 'client-1',
        packageId: 'pkg-1',
        package: { id: 'pkg-1', name: 'Full Website', price: 6500, currency: 'usd' },
        name: 'Riverside Coffee — Full Website',
        status: 'DEVELOPMENT',
        createdAt: '2026-06-02T09:00:00.000Z',
        updatedAt: '2026-08-12T09:00:00.000Z',
      }],
      invoices: [{
        id: 'invoice-1',
        projectId: 'project-1',
        clientId: 'client-1',
        kind: 'DEPOSIT',
        label: 'Deposit — Full Website',
        amountCents: 325000,
        status: 'PAID',
        paidAt: '2026-06-03T09:00:00.000Z',
        createdAt: '2026-06-02T09:00:00.000Z',
      }],
    });
  });

  it('keeps clients from reading another client detail', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-2', role: 'CLIENT' });
    mocks.findFirst.mockResolvedValue(null);

    const response = await GET(request(), params());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Client not found' });
    expect(mocks.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client-1', userId: 'user-2' },
    }));
  });
});
