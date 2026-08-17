import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  createTokenRequest: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({ getAuthenticatedUser: mocks.authenticate }));
vi.mock('@/app/api/_lib/notifications', () => ({ createAblyTokenRequest: mocks.createTokenRequest }));

import { GET } from './route';

function request() {
  return new Request('http://localhost/api/realtime/token') as unknown as NextRequest;
}

describe('GET /api/realtime/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ABLY_API_KEY = 'ably-key';
  });

  it('requires authentication', async () => {
    mocks.authenticate.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(401);
    expect(mocks.createTokenRequest).not.toHaveBeenCalled();
  });

  it('returns a short-lived token request for an authenticated staff member', async () => {
    mocks.authenticate.mockResolvedValue({ id: 'staff-1', role: 'STAFF' });
    mocks.createTokenRequest.mockResolvedValue({ keyName: 'app.key', clientId: 'staff-1', ttl: 300000 });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ clientId: 'staff-1', ttl: 300000 });
    expect(mocks.createTokenRequest).toHaveBeenCalledWith('staff-1', true);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
