import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  createNote: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    project: { findUnique: mocks.findUnique },
    $transaction: mocks.transaction,
  },
}));

import { GET, PATCH } from './route';

const project = {
  id: 'proj-1',
  clientId: 'client-1',
  packageId: 'pkg-1',
  package: {
    id: 'pkg-1',
    name: 'Full Website',
    price: '3250.00',
    currency: 'usd',
  },
  name: 'Riverside Cafe — Full Website',
  status: 'DESIGN' as const,
  createdAt: new Date('2026-06-02T14:00:00.000Z'),
  updatedAt: new Date('2026-08-11T10:00:00.000Z'),
  targetLaunchDate: null,
};

function request(status: string) {
  return new Request('http://localhost/api/projects/proj-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }) as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'proj-1' }) };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/projects/:id', () => {
  it('keeps packageId and adds the serialized package summary', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(project);

    const response = await GET(
      new Request('http://localhost/api/projects/proj-1') as unknown as NextRequest,
      params(),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      packageId: 'pkg-1',
      package: {
        id: 'pkg-1',
        name: 'Full Website',
        price: 3250,
        currency: 'usd',
      },
    });
  });
});

describe('PATCH /api/projects/:id', () => {
  it('refuses clients', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });

    const response = await PATCH(request('REVIEW'), params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('updates the project and records a system status note atomically', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(project);
    mocks.update.mockResolvedValue({ ...project, status: 'DEVELOPMENT' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      project: { update: mocks.update },
      note: { create: mocks.createNote },
    }));

    const response = await PATCH(request('DEVELOPMENT'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'proj-1',
      status: 'DEVELOPMENT',
      createdAt: '2026-06-02T14:00:00.000Z',
    });
    expect(mocks.createNote).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        content: 'Project status changed from Design to Development.',
        isSystem: true,
      },
    });
  });

  it('rejects an unknown project status', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });

    const response = await PATCH(request('NOT_A_STATUS'), params());

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'A valid project status is required' });
  });
});
