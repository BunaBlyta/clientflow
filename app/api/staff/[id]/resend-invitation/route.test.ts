import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findFirst: vi.fn(),
  buildAcceptInviteUrl: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: { user: { findFirst: mocks.findFirst } },
}));

vi.mock('@/app/api/_lib/verification-email', () => ({
  buildAcceptInviteUrl: mocks.buildAcceptInviteUrl,
  issueVerificationEmail: mocks.issueVerificationEmail,
}));

import { POST } from './route';

function request() {
  return new Request('http://localhost/api/staff/staff-2/resend-invitation', {
    method: 'POST',
  }) as unknown as NextRequest;
}

function params(id = 'staff-2') {
  return { params: Promise.resolve({ id }) };
}

describe('POST /api/staff/:id/resend-invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildAcceptInviteUrl.mockReturnValue(
      'https://clientflow.example/accept-invite?email=jordan%40example.com',
    );
  });

  it('returns 401 for an unauthenticated request', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await POST(request(), params());

    expect(response.status).toBe(401);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('returns 403 for a client request', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });

    const response = await POST(request(), params());

    expect(response.status).toBe(403);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it('resends a verification email for a staff user', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findFirst.mockResolvedValue({
      id: 'staff-2',
      email: 'jordan@example.com',
      name: 'Jordan Ellis',
    });
    mocks.issueVerificationEmail.mockResolvedValue(undefined);

    const response = await POST(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ emailSent: true });
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: 'staff-2', role: 'STAFF' },
      select: { id: true, email: true, name: true },
    });
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith({
      id: 'staff-2',
      email: 'jordan@example.com',
      name: 'Jordan Ellis',
      acceptInviteUrl: 'https://clientflow.example/accept-invite?email=jordan%40example.com',
    });
    expect(mocks.buildAcceptInviteUrl).toHaveBeenCalledWith('jordan@example.com', 'http://localhost');
  });

  it('returns emailSent false when the resend email fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findFirst.mockResolvedValue({
      id: 'staff-2',
      email: 'jordan@example.com',
      name: 'Jordan Ellis',
    });
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));

    const response = await POST(request(), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ emailSent: false });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('returns 404 when the id is not an existing staff user', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findFirst.mockResolvedValue(null);

    const response = await POST(request(), params('client-1'));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Staff user not found' });
    expect(mocks.issueVerificationEmail).not.toHaveBeenCalled();
  });
});
