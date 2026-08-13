import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  leadFindUnique: vi.fn(),
  clientFindFirst: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    contactLead: { findUnique: mocks.leadFindUnique },
    client: { findFirst: mocks.clientFindFirst },
  },
}));

import { GET } from './route';

const lead = {
  id: 'lead-1',
  name: 'Ava Marlowe',
  email: 'ava@example.com',
  message: 'We need a client portal.',
  createdAt: new Date('2026-08-13T10:00:00.000Z'),
};

const client = {
  id: 'client-1',
  userId: 'user-1',
  name: 'Ava Marlowe',
  email: 'ava@example.com',
  companyName: 'Marlowe Studio',
  phone: null,
  createdAt: new Date('2026-08-01T10:00:00.000Z'),
  projects: [],
};

function request() {
  return new Request('http://localhost/api/contact-leads/lead-1') as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'lead-1' }) };
}

describe('GET /api/contact-leads/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('requires staff access', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });

    const response = await GET(request(), params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.leadFindUnique).not.toHaveBeenCalled();
  });

  it('returns inquiry details and the existing client context', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.leadFindUnique.mockResolvedValue(lead);
    mocks.clientFindFirst.mockResolvedValue(client);

    const response = await GET(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: 'lead-1',
      name: 'Ava Marlowe',
      email: 'ava@example.com',
      message: 'We need a client portal.',
      createdAt: '2026-08-13T10:00:00.000Z',
      client: {
        id: 'client-1',
        userId: 'user-1',
        companyName: 'Marlowe Studio',
        contactName: 'Ava Marlowe',
        email: 'ava@example.com',
        createdAt: '2026-08-01T10:00:00.000Z',
      },
      projects: [],
    });
  });

  it('returns 404 for an unknown inquiry', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.leadFindUnique.mockResolvedValue(null);

    const response = await GET(request(), params());

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Custom inquiry not found' });
    expect(mocks.clientFindFirst).not.toHaveBeenCalled();
  });
});
