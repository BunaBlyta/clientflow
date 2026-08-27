import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  transaction: vi.fn(),
  projectFindUnique: vi.fn(),
  noteCreate: vi.fn(),
  staffFindMany: vi.fn(),
  notificationCreate: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    $transaction: mocks.transaction,
  },
}));

import { POST } from './route';
import { MAX_NOTE_BODY_LENGTH } from '@/app/api/_lib/text-limits';

function request(body: unknown) {
  return new Request('http://localhost/api/notes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function setupTransaction() {
  mocks.transaction.mockImplementation(async (callback) => callback({
    project: { findUnique: mocks.projectFindUnique },
    note: { create: mocks.noteCreate },
    user: { findMany: mocks.staffFindMany },
    notification: { create: mocks.notificationCreate },
  }));
}

describe('POST /api/notes', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects a client posting to another client project', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-other',
      clientId: 'client-2',
      client: { userId: 'user-client-2' },
    });
    setupTransaction();

    const response = await POST(request({
      projectId: 'proj-other',
      body: 'This must not be visible to another client.',
    }));

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: 'Project not found' });
    expect(mocks.noteCreate).not.toHaveBeenCalled();
    expect(mocks.notificationCreate).not.toHaveBeenCalled();
  });

  it('creates a client note and notifies every staff user', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      clientId: 'client-1',
      client: { userId: 'user-client-1' },
    });
    mocks.noteCreate.mockResolvedValue({
      id: 'note-new',
      projectId: 'proj-1',
      authorId: 'user-client-1',
      content: 'Could we add a testimonials section?',
      createdAt: new Date('2026-08-12T10:30:00.000Z'),
      author: { name: 'Jordan Ellis', role: 'CLIENT' },
    });
    mocks.staffFindMany.mockResolvedValue([{ id: 'staff-1' }, { id: 'staff-2' }]);
    setupTransaction();

    const response = await POST(request({
      projectId: 'proj-1',
      body: '  Could we add a testimonials section?  ',
      authorId: 'staff-from-body',
      isSystem: true,
    }));

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      id: 'note-new',
      projectId: 'proj-1',
      authorId: 'user-client-1',
      authorName: 'Jordan Ellis',
      authorRole: 'CLIENT',
      body: 'Could we add a testimonials section?',
      createdAt: '2026-08-12T10:30:00.000Z',
    });
    expect(mocks.noteCreate).toHaveBeenCalledWith({
      data: {
        projectId: 'proj-1',
        authorId: 'user-client-1',
        content: 'Could we add a testimonials section?',
        isSystem: false,
      },
      select: expect.any(Object),
    });
    expect(mocks.notificationCreate).toHaveBeenCalledTimes(2);
    expect(mocks.notificationCreate).toHaveBeenNthCalledWith(1, {
      data: {
        userId: 'staff-1',
        type: 'NEW_NOTE',
        projectId: 'proj-1',
        title: 'New note from a client',
        message: 'Could we add a testimonials section?',
      },
    });
  });

  it('creates a staff note and notifies only the client', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      clientId: 'client-1',
      client: { userId: 'user-client-1' },
    });
    mocks.noteCreate.mockResolvedValue({
      id: 'note-new',
      projectId: 'proj-1',
      authorId: 'staff-1',
      content: 'The staging link is ready.',
      createdAt: new Date('2026-08-12T10:30:00.000Z'),
      author: { name: 'Sam Torres', role: 'STAFF' },
    });
    setupTransaction();

    const response = await POST(request({
      projectId: 'proj-1',
      body: 'The staging link is ready.',
    }));

    expect(response.status).toBe(201);
    expect(mocks.notificationCreate).toHaveBeenCalledWith({
      data: {
        userId: 'user-client-1',
        type: 'NEW_NOTE',
        projectId: 'proj-1',
        title: 'New note from the studio',
        message: 'The staging link is ready.',
      },
    });
    expect(mocks.staffFindMany).not.toHaveBeenCalled();
  });

  it('accepts the complete note body at the explicit limit without truncating it', async () => {
    const longBody = 'x'.repeat(MAX_NOTE_BODY_LENGTH);
    mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });
    mocks.projectFindUnique.mockResolvedValue({
      id: 'proj-1',
      clientId: 'client-1',
      client: { userId: 'user-client-1' },
    });
    mocks.noteCreate.mockResolvedValue({
      id: 'note-long',
      projectId: 'proj-1',
      authorId: 'user-client-1',
      content: longBody,
      createdAt: new Date('2026-08-12T10:30:00.000Z'),
      author: { name: 'Jordan Ellis', role: 'CLIENT' },
    });
    mocks.staffFindMany.mockResolvedValue([]);
    setupTransaction();

    const response = await POST(request({ projectId: 'proj-1', body: longBody }));

    expect(response.status).toBe(201);
    expect(mocks.noteCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ content: longBody }),
    }));
  });

  it('rejects a note body over the explicit limit instead of truncating it', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'user-client-1', role: 'CLIENT' });
    setupTransaction();

    const response = await POST(request({
      projectId: 'proj-1',
      body: 'x'.repeat(MAX_NOTE_BODY_LENGTH + 1),
    }));

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: `Note body is required and must be ${MAX_NOTE_BODY_LENGTH.toLocaleString()} characters or fewer`,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
