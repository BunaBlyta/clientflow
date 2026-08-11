import { describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
  transactionRequestFindUnique: vi.fn(),
  transactionRequestUpdate: vi.fn(),
  userFindUnique: vi.fn(),
  userCreate: vi.fn(),
  clientCreate: vi.fn(),
  issueVerificationEmail: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    projectRequest: {
      findUnique: mocks.findUnique,
      update: mocks.update,
    },
    $transaction: mocks.transaction,
  },
}));

vi.mock('@/app/api/_lib/verification-email', () => ({
  issueVerificationEmail: mocks.issueVerificationEmail,
}));

import { PATCH } from './route';

const pendingRequest = {
  id: 'req-1',
  packageId: 'pkg-1',
  name: 'Alex Morgan',
  email: 'alex@example.com',
  companyName: 'Alex Studio',
  message: 'Build us a new site.',
  status: 'PENDING' as const,
  clientId: null,
  createdAt: new Date('2026-08-11T10:00:00.000Z'),
  reviewedAt: null,
};

function request(status: string) {
  return new Request('http://localhost/api/requests/req-1', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ status }),
  }) as unknown as NextRequest;
}

function params() {
  return { params: Promise.resolve({ id: 'req-1' }) };
}

function setupTransaction() {
  mocks.transaction.mockImplementation(async (callback: (transaction: unknown) => unknown) =>
    callback({
      projectRequest: {
        findUnique: mocks.transactionRequestFindUnique,
        update: mocks.transactionRequestUpdate,
      },
      user: {
        findUnique: mocks.userFindUnique,
        create: mocks.userCreate,
      },
      client: { create: mocks.clientCreate },
    }),
  );
}

describe('PATCH /api/requests/:id', () => {
  it('refuses clients before looking up the request', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'CLIENT' });

    const response = await PATCH(request('APPROVED'), params());

    expect(response.status).toBe(403);
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });

  it('returns 409 when an already-approved request is reviewed again', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({ ...pendingRequest, status: 'APPROVED' });

    const response = await PATCH(request('REJECTED'), params());

    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({
      error: 'Project request cannot transition from APPROVED to REJECTED',
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('rejects without creating a user, client, project, or sending email', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(pendingRequest);
    mocks.update.mockResolvedValue({ ...pendingRequest, status: 'REJECTED' });

    const response = await PATCH(request('REJECTED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'req-1', status: 'REJECTED' });
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.clientCreate).not.toHaveBeenCalled();
    expect(mocks.issueVerificationEmail).not.toHaveBeenCalled();
  });

  it('approves by creating exactly one user and one client in one transaction', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(pendingRequest);
    mocks.transactionRequestFindUnique.mockResolvedValue(pendingRequest);
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.userCreate.mockResolvedValue({
      id: 'user-1',
      email: pendingRequest.email,
      name: pendingRequest.name,
      client: null,
    });
    mocks.clientCreate.mockResolvedValue({ id: 'client-1' });
    mocks.transactionRequestUpdate.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
      clientId: 'client-1',
      reviewedAt: new Date('2026-08-11T10:05:00.000Z'),
    });
    mocks.issueVerificationEmail.mockResolvedValue(undefined);
    setupTransaction();

    const response = await PATCH(request('APPROVED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      request: { id: 'req-1', status: 'APPROVED', clientId: 'client-1' },
      emailSent: true,
    });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.userCreate).toHaveBeenCalledTimes(1);
    expect(mocks.clientCreate).toHaveBeenCalledTimes(1);
    expect(mocks.transactionRequestUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'req-1' },
      data: expect.objectContaining({ status: 'APPROVED', clientId: 'client-1' }),
    }));
    expect(mocks.issueVerificationEmail).toHaveBeenCalledWith({
      id: 'user-1',
      email: pendingRequest.email,
      name: pendingRequest.name,
    });
  });

  it('keeps an approval successful when the verification email fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(pendingRequest);
    mocks.transactionRequestFindUnique.mockResolvedValue(pendingRequest);
    mocks.userFindUnique.mockResolvedValue({
      id: 'user-1',
      email: pendingRequest.email,
      name: pendingRequest.name,
      client: { id: 'client-1' },
    });
    mocks.transactionRequestUpdate.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
      clientId: 'client-1',
      reviewedAt: new Date('2026-08-11T10:05:00.000Z'),
    });
    mocks.issueVerificationEmail.mockRejectedValue(new Error('Resend unavailable'));
    setupTransaction();

    const response = await PATCH(request('APPROVED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      request: { status: 'APPROVED' },
      emailSent: false,
    });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
