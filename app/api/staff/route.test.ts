import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findMany: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    user: {
      findMany: mocks.findMany,
      findUnique: mocks.findUnique,
      create: mocks.create,
    },
  },
}));

vi.mock('@/app/api/_lib/verification-email', () => ({
  issueVerificationEmail: mocks.issueVerificationEmail,
}));

import { GET, POST } from './route';

const staffUser = {
  id: 'staff-2',
  email: 'jordan@example.com',
  name: 'Jordan Ellis',
  role: 'STAFF' as const,
  isActive: false,
  createdAt: new Date('2026-08-13T09:00:00.000Z'),
};

function getRequest() {
  return new Request('http://localhost/api/staff') as unknown as NextRequest;
}

function postRequest(body: unknown) {
  return new Request('http://localhost/api/staff/invite', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('GET /api/staff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for an unauthenticated request', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await GET(getRequest());

    expect(response.status).toBe(401);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('returns 403 for a client request', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });

    const response = await GET(getRequest());

    expect(response.status).toBe(403);
    expect(mocks.findMany).not.toHaveBeenCalled();
  });

  it('returns staff users without sensitive fields in creation order', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findMany.mockResolvedValue([staffUser]);

    const response = await GET(getRequest());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      {
        id: 'staff-2',
        email: 'jordan@example.com',
        name: 'Jordan Ellis',
        role: 'STAFF',
        isActive: false,
        createdAt: '2026-08-13T09:00:00.000Z',
      },
    ]);
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { role: 'STAFF' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('POST /api/staff/invite', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 for an unauthenticated request', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await POST(postRequest({ email: 'jordan@example.com', name: 'Jordan Ellis' }));

    expect(response.status).toBe(401);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('returns 403 for a client request', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });

    const response = await POST(postRequest({ email: 'jordan@example.com', name: 'Jordan Ellis' }));

    expect(response.status).toBe(403);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an invalid invite body with 400', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });

    const response = await POST(postRequest({ email: 'not-an-email' }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Name is required and must be 120 characters or fewer',
    });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('returns 409 when any user already has the invite email', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ id: 'existing-client-1' });

    const response = await POST(postRequest({
      email: ' Existing@Example.com ',
      name: 'Jordan Ellis',
    }));

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: 'A user with that email already exists' });
    expect(mocks.findUnique).toHaveBeenCalledWith({
      where: { email: 'existing@example.com' },
      select: { id: true },
    });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it('creates an inactive staff user and sends the verification email', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue(staffUser);
    mocks.issueVerificationEmail.mockResolvedValue(undefined);

    const response = await POST(postRequest({
      email: ' Jordan@Example.com ',
      name: ' Jordan Ellis ',
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      user: {
        id: 'staff-2',
        email: 'jordan@example.com',
        name: 'Jordan Ellis',
        role: 'STAFF',
        isActive: false,
        createdAt: '2026-08-13T09:00:00.000Z',
      },
      emailSent: true,
    });
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        email: 'jordan@example.com',
        name: 'Jordan Ellis',
        role: 'STAFF',
        isActive: false,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith({
      id: 'staff-2',
      email: 'jordan@example.com',
      name: 'Jordan Ellis',
    });
  });

  it('keeps the created user when the invitation email fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(null);
    mocks.create.mockResolvedValue(staffUser);
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));

    const response = await POST(postRequest({ email: 'jordan@example.com', name: 'Jordan Ellis' }));

    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      user: { id: 'staff-2', email: 'jordan@example.com', isActive: false },
      emailSent: false,
    });
    expect(mocks.create).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
