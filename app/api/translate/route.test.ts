import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

import { GOOGLE_TRANSLATE_REQUEST_TIMEOUT_MS, POST } from './route';
import { MAX_TRANSLATION_TEXT_LENGTH } from '@/app/api/_lib/text-limits';

function request(body: unknown) {
  return new Request('http://localhost/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function googleResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('GOOGLE_TRANSLATE_API_KEY', 'test-google-key');
    vi.stubGlobal('fetch', mocks.fetch);
    mocks.authenticate.mockResolvedValue({ id: 'client-1', role: 'CLIENT' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requires authentication before accepting content', async () => {
    mocks.authenticate.mockResolvedValue(null);

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Authentication required' });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('validates required fields, supported languages, and the shared text limit', async () => {
    const cases = [
      {
        body: { text: '   ', targetLanguage: 'de' },
        error: 'Text is required and must be a non-empty string',
      },
      {
        body: { text: 'Hello', targetLanguage: 'fr' },
        error: 'Target language must be one of: en, sq, de',
      },
      {
        body: { text: 'Hello', targetLanguage: 'de', sourceLanguage: 'fr' },
        error: 'Source language must be one of: en, sq, de, or auto',
      },
      {
        body: { text: 'notes.writeNote', targetLanguage: 'de' },
        error: 'Only user-entered note or message content can be translated',
      },
      {
        body: {
          text: 'x'.repeat(MAX_TRANSLATION_TEXT_LENGTH + 1),
          targetLanguage: 'de',
        },
        error: `Text must be ${MAX_TRANSLATION_TEXT_LENGTH.toLocaleString()} characters or fewer`,
      },
    ];

    for (const testCase of cases) {
      const response = await POST(request(testCase.body));
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: testCase.error });
    }

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('accepts the complete shared limit without changing the original text', async () => {
    const text = 'x'.repeat(MAX_TRANSLATION_TEXT_LENGTH);
    mocks.fetch.mockResolvedValue(
      googleResponse({ data: { translations: [{ translatedText: 'übersetzt' }] } }),
    );

    const response = await POST(request({ text, targetLanguage: 'de' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      originalText: text,
      translatedText: 'übersetzt',
      targetLanguage: 'de',
    });
  });

  it('reports missing server-side Google configuration without calling the provider', async () => {
    vi.stubEnv('GOOGLE_TRANSLATE_API_KEY', '');

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Translation service is not configured. Add GOOGLE_TRANSLATE_API_KEY on the server.',
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('maps supported languages to Google codes and preserves the source text', async () => {
    const originalText = 'Hello, studio.\nPlease keep this line.';
    mocks.fetch.mockResolvedValue(
      googleResponse({
        data: { translations: [{ translatedText: 'Përshëndetje, studio.' }] },
      }),
    );

    const response = await POST(
      request({
        text: originalText,
        targetLanguage: 'sq',
        sourceLanguage: 'en',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      originalText,
      translatedText: 'Përshëndetje, studio.',
      targetLanguage: 'sq',
      sourceLanguage: 'en',
    });

    const [url, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://translation.googleapis.com/language/translate/v2');
    expect(init.headers).toMatchObject({
      'x-goog-api-key': 'test-google-key',
    });
    expect(JSON.parse(String(init.body))).toEqual({
      q: [originalText],
      target: 'sq',
      source: 'en',
      format: 'text',
    });
  });

  it('lets Google auto-detect the source language when requested', async () => {
    mocks.fetch.mockResolvedValue(
      googleResponse({ data: { translations: [{ translatedText: 'Hallo' }] } }),
    );

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'auto' }),
    );

    expect(response.status).toBe(200);
    const [, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.target).toBe('de');
    expect(body).not.toHaveProperty('source');
  });

  it('returns a safe non-500 response when Google rejects the request', async () => {
    mocks.fetch.mockResolvedValue(googleResponse({ error: { message: 'bad key' } }, 403));

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Translation service is unavailable. Please try again.',
    });
  });

  it('returns a timeout response when Google does not answer in time', async () => {
    vi.useFakeTimers();
    mocks.fetch.mockImplementation(
      (_input: string, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );

    const responsePromise = POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(GOOGLE_TRANSLATE_REQUEST_TIMEOUT_MS);
    const response = await responsePromise;

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: 'Translation service timed out. Please try again.',
    });
  });
});
