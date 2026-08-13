import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findUnique: vi.fn(),
  invoiceFindFirst: vi.fn(),
  update: vi.fn(),
  createNote: vi.fn(),
  clientFindUnique: vi.fn(),
  notificationCreate: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    project: { findUnique: mocks.findUnique },
    invoice: { findFirst: mocks.invoiceFindFirst },
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

const pendingProject = { ...project, status: 'PENDING' as const };
const customPendingProject = { ...pendingProject, packageId: null, package: null };
const discoveryProject = { ...project, status: 'DISCOVERY' as const };

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
  it('refuses unauthenticated requests', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await PATCH(request('DESIGN'), params());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('refuses clients', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });

    const response = await PATCH(request('REVIEW'), params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it.each(['DESIGN', 'CANCELLED'] as const)(
    'rejects an unpaid PENDING project moving to %s',
    async (status) => {
      mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
      mocks.findUnique.mockResolvedValue(pendingProject);
      mocks.invoiceFindFirst.mockResolvedValue({ status: 'SENT' });

      const response = await PATCH(request(status), params());

      expect(response.status).toBe(409);
      expect(await response.json()).toEqual({
        error:
          'The deposit must be paid before the project can move forward. Discovery is set automatically after confirmed payment.',
      });
      expect(mocks.invoiceFindFirst).toHaveBeenCalledWith({
        where: { projectId: 'proj-1', type: 'DEPOSIT' },
        orderBy: { createdAt: 'asc' },
        select: { status: true },
      });
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );

  it('rejects staff from manually setting PENDING to DISCOVERY', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(pendingProject);

    const response = await PATCH(request('DISCOVERY'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error:
        'The deposit must be paid before the project can move forward. Discovery is set automatically after confirmed payment.',
    });
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('keeps custom PENDING projects available for their existing manual non-Discovery flow', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(customPendingProject);
    mocks.invoiceFindFirst.mockResolvedValue(null);
    mocks.update.mockResolvedValue({ ...customPendingProject, status: 'DESIGN' });
    mocks.clientFindUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) => callback({
      project: { update: mocks.update },
      note: { create: mocks.createNote },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('DESIGN'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'DESIGN', packageId: null, package: null });
  });

  it('allows valid manual changes once a project is already in Discovery or later', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(discoveryProject);
    mocks.update.mockResolvedValue({ ...discoveryProject, status: 'DESIGN' });
    mocks.clientFindUnique.mockResolvedValue(null);
    mocks.transaction.mockImplementation(async (callback) => callback({
      project: { update: mocks.update },
      note: { create: mocks.createNote },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
    }));

    const response = await PATCH(request('DESIGN'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'DESIGN' });
    expect(mocks.invoiceFindFirst).not.toHaveBeenCalled();
  });

  it('updates the project and records a system status note atomically', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(project);
    mocks.update.mockResolvedValue({ ...project, status: 'DEVELOPMENT' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-1' });
    mocks.transaction.mockImplementation(async (callback) => callback({
      project: { update: mocks.update },
      note: { create: mocks.createNote },
      client: { findUnique: mocks.clientFindUnique },
      notification: { create: mocks.notificationCreate },
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
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'PROJECT_STAGE_CHANGED',
        projectId: 'proj-1',
        title: 'Riverside Cafe — Full Website moved to Development',
        message: 'Your project moved from Design to Development.',
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
