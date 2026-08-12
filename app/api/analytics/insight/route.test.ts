import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  getAuthenticatedUser: vi.fn(),
  packageFindMany: vi.fn(),
  projectFindMany: vi.fn(),
  invoiceFindMany: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

vi.mock('@/app/api/_lib/prisma', () => ({
  prisma: {
    package: { findMany: mocks.packageFindMany },
    project: { findMany: mocks.projectFindMany },
    invoice: { findMany: mocks.invoiceFindMany },
  },
}));

import { POST } from './route';

function request() {
  return new Request('http://localhost/api/analytics/insight', { method: 'POST' }) as unknown as NextRequest;
}

function seedAnalyticsData() {
  mocks.packageFindMany.mockResolvedValue([
    {
      id: 'pkg-landing-page',
      name: 'Landing Page',
      slug: 'landing-page',
      description: 'A single high-converting page.',
      price: '2500.00',
      currency: 'usd',
      estimatedDuration: '2–3 weeks',
      sortOrder: 1,
    },
  ]);
  mocks.projectFindMany.mockResolvedValue([
    {
      id: 'proj-2',
      clientId: 'client-1',
      packageId: 'pkg-landing-page',
      name: 'Riverside Cafe — Landing Page Refresh',
      status: 'REVIEW',
      createdAt: new Date('2026-05-10T14:00:00.000Z'),
      updatedAt: new Date('2026-08-08T16:00:00.000Z'),
      targetLaunchDate: null,
    },
  ]);
  mocks.invoiceFindMany.mockResolvedValue([
    {
      id: 'inv-4',
      projectId: 'proj-2',
      clientId: 'client-1',
      type: 'DEPOSIT',
      description: 'Deposit — Landing Page Refresh',
      amount: '1250.00',
      status: 'PAID',
      dueDate: null,
      paidAt: new Date('2026-05-11T09:00:00.000Z'),
      createdAt: new Date('2026-05-10T14:10:00.000Z'),
    },
  ]);
}

describe('POST /api/analytics/insight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GEMINI_API_KEY', 'test-gemini-key');
    mocks.getAuthenticatedUser.mockResolvedValue({ role: 'STAFF' });
    seedAnalyticsData();
    vi.stubGlobal('fetch', mocks.fetch);
  });

  it('requires authentication', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('requires a staff session', async () => {
    mocks.getAuthenticatedUser.mockResolvedValue({ role: 'CLIENT' });

    const response = await POST(request());

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: 'Staff access required' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('reports missing Gemini configuration', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');

    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ error: 'Analytics insights are not configured yet.' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('returns a safe error when Gemini fails', async () => {
    mocks.fetch.mockResolvedValue(new Response('{}', { status: 503 }));

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'We couldn’t generate an insight right now.' });
  });

  it('returns a safe error when Gemini returns no text', async () => {
    mocks.fetch.mockResolvedValue(
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{}] } }] }), { status: 200 }),
    );

    const response = await POST(request());

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({ error: 'We couldn’t generate an insight right now.' });
  });

  it('parses the generated text and sends computed stage data', async () => {
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ candidates: [{ content: { parts: [{ text: 'Revenue is concentrated in the Landing Page package.' }] } }] }),
        { status: 200 },
      ),
    );

    const response = await POST(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      insight: 'Revenue is concentrated in the Landing Page package.',
    });

    const [, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    const prompt = JSON.parse(String(init.body)).contents[0].parts[0].text as string;
    expect(prompt).toContain('projectsByStage');
    expect(prompt).toContain('REVIEW');
    expect(init.headers).toMatchObject({ 'x-goog-api-key': 'test-gemini-key' });
  });
});
