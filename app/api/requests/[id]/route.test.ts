import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  projectCreate: vi.fn(),
  invoiceCreate: vi.fn(),
  clientFindUnique: vi.fn(),
  notificationCreate: vi.fn(),
  sendRejectionEmail: vi.fn(),
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

vi.mock('@/app/api/_lib/resend', () => ({
  sendRejectionEmail: mocks.sendRejectionEmail,
}));

import { GET, PATCH } from './route';

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
  package: {
    name: 'Full Website',
    price: '6500.00',
    currency: 'usd',
  },
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
      client: { create: mocks.clientCreate, findUnique: mocks.clientFindUnique },
      project: { create: mocks.projectCreate },
      invoice: { create: mocks.invoiceCreate },
      notification: { create: mocks.notificationCreate },
    }),
  );
}

describe('PATCH /api/requests/:id', () => {
  beforeEach(() => vi.clearAllMocks());

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
    expect(mocks.projectCreate).not.toHaveBeenCalled();
    expect(mocks.invoiceCreate).not.toHaveBeenCalled();
  });

  it('rejects and emails a first-time prospect without creating client data', async () => {
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(pendingRequest);
    mocks.transactionRequestUpdate.mockResolvedValue({ ...pendingRequest, status: 'REJECTED' });
    mocks.sendRejectionEmail.mockResolvedValue(undefined);
    setupTransaction();

    const response = await PATCH(request('REJECTED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ id: 'req-1', status: 'REJECTED', emailSent: true });
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
    expect(mocks.userCreate).not.toHaveBeenCalled();
    expect(mocks.clientCreate).not.toHaveBeenCalled();
    expect(mocks.projectCreate).not.toHaveBeenCalled();
    expect(mocks.invoiceCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
    expect(mocks.sendRejectionEmail).toHaveBeenCalledWith({
      email: pendingRequest.email,
      name: pendingRequest.name,
    });
  });

  it('keeps the linked-client rejection notification while emailing the prospect', async () => {
    const linkedRequest = { ...pendingRequest, clientId: 'client-1' };
    mocks.authenticate.mockResolvedValue({ role: 'STAFF' });
    mocks.findUnique.mockResolvedValue(linkedRequest);
    mocks.transactionRequestUpdate.mockResolvedValue({ ...linkedRequest, status: 'REJECTED' });
    mocks.clientFindUnique.mockResolvedValue({ userId: 'user-1' });
    mocks.sendRejectionEmail.mockResolvedValue(undefined);
    setupTransaction();

    const response = await PATCH(request('REJECTED'), params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'REJECTED', emailSent: true });
    expect(mocks.sendRejectionEmail).toHaveBeenCalledWith({
      email: linkedRequest.email,
      name: linkedRequest.name,
    });
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'REQUEST_REJECTED',
        requestId: 'req-1',
        title: 'Project request update',
        message: 'Your project request was not approved at this time.',
      },
    });
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
    mocks.projectCreate.mockResolvedValue({ id: 'project-1' });
    mocks.invoiceCreate.mockResolvedValue({ id: 'invoice-1' });
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
    expect(mocks.projectCreate).toHaveBeenCalledTimes(1);
    expect(mocks.invoiceCreate).toHaveBeenCalledTimes(1);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        type: 'REQUEST_APPROVED',
        requestId: 'req-1',
        projectId: 'project-1',
        title: 'Project request approved',
        message: 'Your project is ready. Your deposit invoice is available to pay.',
      },
    });
    expect(mocks.projectCreate).toHaveBeenCalledWith({
      data: {
        clientId: 'client-1',
        packageId: 'pkg-1',
        name: 'Alex Studio — Full Website',
        status: 'PENDING',
      },
      select: { id: true },
    });
    expect(mocks.invoiceCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'project-1',
        clientId: 'client-1',
        type: 'DEPOSIT',
        description: 'Deposit — Full Website',
        amount: '3250.00',
        currency: 'usd',
        status: 'SENT',
        issuedAt: expect.any(Date),
      }),
    });
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
    mocks.projectCreate.mockResolvedValue({ id: 'project-1' });
    mocks.invoiceCreate.mockResolvedValue({ id: 'invoice-1' });
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

describe('GET /api/requests/:id', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns request details with the linked client and all of that client’s projects', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.findUnique.mockResolvedValue({
      ...pendingRequest,
      status: 'APPROVED',
      clientId: 'client-1',
      client: {
        id: 'client-1',
        userId: 'user-1',
        name: 'Alex Morgan',
        email: 'alex@example.com',
        companyName: 'Alex Studio',
        phone: null,
        createdAt: new Date('2026-08-11T10:05:00.000Z'),
        projects: [{
          id: 'project-1',
          clientId: 'client-1',
          packageId: 'pkg-1',
          package: { id: 'pkg-1', name: 'Full Website', price: '6500.00', currency: 'usd' },
          name: 'Alex Studio — Full Website',
          status: 'PENDING',
          createdAt: new Date('2026-08-11T10:05:00.000Z'),
          updatedAt: new Date('2026-08-11T10:05:00.000Z'),
          targetLaunchDate: null,
        }],
      },
    });

    const response = await GET(new Request('http://localhost/api/requests/req-1') as unknown as NextRequest, params());

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 'req-1',
      status: 'APPROVED',
      clientId: 'client-1',
      package: { id: 'pkg-1', name: 'Full Website', price: 6500, currency: 'usd' },
      client: {
        id: 'client-1',
        companyName: 'Alex Studio',
        contactName: 'Alex Morgan',
        email: 'alex@example.com',
      },
      projects: [{
        id: 'project-1',
        name: 'Alex Studio — Full Website',
        status: 'PENDING',
      }],
    });
  });

  it('keeps request details staff-only', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-1', role: 'CLIENT' });

    const response = await GET(new Request('http://localhost/api/requests/req-1') as unknown as NextRequest, params());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.findUnique).not.toHaveBeenCalled();
  });
});
