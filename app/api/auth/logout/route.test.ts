import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

vi.mock('@/app/api/_lib/auth', () => ({
  SESSION_COOKIE: 'clientflow_session',
}));

import { POST } from './route';

function request(session?: string) {
  const headers = new Headers();
  if (session) headers.set('cookie', `clientflow_session=${session}`);

  return new Request('http://localhost/api/auth/logout', {
    method: 'POST',
    headers,
  }) as unknown as NextRequest;
}

describe('POST /api/auth/logout', () => {
  beforeEach(() => vi.clearAllMocks());

  it('clears the session cookie and succeeds again without a session', async () => {
    const firstResponse = await POST(request('session-token'));

    expect(firstResponse.status).toBe(200);
    expect(await firstResponse.json()).toEqual({ loggedOut: true });
    const firstSetCookie = firstResponse.headers.get('set-cookie');
    expect(firstSetCookie).toContain('clientflow_session=;');
    expect(firstSetCookie).toMatch(/Max-Age=0/i);
    expect(firstSetCookie).toMatch(/Expires=Thu, 01 Jan 1970 00:00:00 GMT/i);

    const secondResponse = await POST(request());

    expect(secondResponse.status).toBe(200);
    expect(await secondResponse.json()).toEqual({ loggedOut: true });
    expect(secondResponse.headers.get('set-cookie')).toMatch(/clientflow_session=;/i);
  });
});
