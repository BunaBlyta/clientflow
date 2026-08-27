import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  clientFindUnique: vi.fn(),
  clientUpdate: vi.fn(),
  userUpdate: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    client: { findUnique: mocks.clientFindUnique, update: mocks.clientUpdate },
    user: { update: mocks.userUpdate },
  },
}));

import { GET, PATCH } from './route';

function request() {
  return new Request('http://localhost/api/auth/me') as unknown as NextRequest;
}

function patchRequest(body: unknown) {
  return new Request('http://localhost/api/auth/me', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
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
    mocks.clientFindUnique.mockResolvedValue({
      id: 'client-1',
      companyName: 'Riverside Coffee',
      phone: '+1 555 0100',
    });

    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'user-client-1',
      name: 'Jordan Ellis',
      email: 'jordan@riversidecoffee.com',
      role: 'CLIENT',
      clientId: 'client-1',
      companyName: 'Riverside Coffee',
      phone: '+1 555 0100',
    });
    expect(mocks.clientFindUnique).toHaveBeenCalledWith({
      where: { userId: 'user-client-1' },
      select: { id: true, companyName: true, phone: true },
    });
  });
});

describe('PATCH /api/auth/me', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 without a valid session', async () => {
    mocks.authenticate.mockResolvedValue(null);
    const response = await PATCH(patchRequest({ name: 'New Name' }));
    expect(response.status).toBe(401);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('rejects a body with no recognised fields', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'user-client-1', name: 'Jordan', email: 'j@x.com', role: 'CLIENT',
    });
    const response = await PATCH(patchRequest({ email: 'new@x.com' }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: 'No changes provided' });
  });

  it('rejects an empty name', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'user-client-1', name: 'Jordan', email: 'j@x.com', role: 'CLIENT',
    });
    const response = await PATCH(patchRequest({ name: '   ' }));
    expect(response.status).toBe(400);
    expect(mocks.userUpdate).not.toHaveBeenCalled();
  });

  it('updates the user name and the client company/phone, keeping Client.name in sync', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'user-client-1', name: 'Jordan Ellis', email: 'jordan@riversidecoffee.com', role: 'CLIENT',
    });
    mocks.clientFindUnique.mockResolvedValue({
      id: 'client-1', companyName: 'Riverside Coffee Co', phone: null,
    });

    const response = await PATCH(patchRequest({
      name: '  Jordan A. Ellis ',
      companyName: '  Riverside Coffee Co  ',
      phone: '',
    }));

    expect(response.status).toBe(200);
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: 'user-client-1' },
      data: { name: 'Jordan A. Ellis' },
    });
    expect(mocks.clientUpdate).toHaveBeenCalledWith({
      where: { userId: 'user-client-1' },
      data: { name: 'Jordan A. Ellis', companyName: 'Riverside Coffee Co', phone: null },
    });
    expect(await response.json()).toMatchObject({
      name: 'Jordan A. Ellis',
      companyName: 'Riverside Coffee Co',
      phone: null,
    });
  });

  it('refuses company/phone edits from a staff account', async () => {
    mocks.authenticate.mockResolvedValue({
      id: 'staff-1', name: 'Sam', email: 'sam@studio.com', role: 'STAFF',
    });
    const response = await PATCH(patchRequest({ companyName: 'Anything' }));
    expect(response.status).toBe(400);
    expect(mocks.clientUpdate).not.toHaveBeenCalled();
  });
});
