import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fetchMock = vi.fn();

import { sendVerificationEmail } from './resend';

describe('sendVerificationEmail', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.RESEND_FROM_EMAIL = 'Clientflow <test@example.com>';
    fetchMock.mockResolvedValue({ ok: true, status: 200 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;
    vi.clearAllMocks();
  });

  it('keeps client verification emails code-only while stating the real TTL', async () => {
    await sendVerificationEmail({
      email: 'client@example.com',
      name: 'Client User',
      code: '123456',
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { text: string };
    expect(body.text).toContain('123456');
    expect(body.text).toContain('expires in 30 minutes');
    expect(body.text).not.toContain('/accept-invite');
    expect(body.text).not.toContain('10 minutes');
  });

  it('includes the staff accept-invite URL and real TTL when provided', async () => {
    const acceptInviteUrl = 'https://clientflow.example/accept-invite?email=staff%40example.com';

    await sendVerificationEmail({
      email: 'staff@example.com',
      name: 'Staff User',
      code: '654321',
      acceptInviteUrl,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string) as { text: string };
    expect(body.text).toContain('654321');
    expect(body.text).toContain(`Accept your Clientflow invitation: ${acceptInviteUrl}`);
    expect(body.text).toContain('expires in 30 minutes');
    expect(body.text).not.toContain('10 minutes');
  });
});
