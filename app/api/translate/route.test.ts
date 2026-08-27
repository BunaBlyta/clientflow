import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

import { DEEPL_REQUEST_TIMEOUT_MS, POST } from './route';
import { MAX_TRANSLATION_TEXT_LENGTH } from '@/app/api/_lib/text-limits';

function request(body: unknown) {
  return new Request('http://localhost/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function deepLResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DEEPL_API_KEY', 'test-deepl-key');
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
      deepLResponse({ translations: [{ text: 'übersetzt' }] }),
    );

    const response = await POST(request({ text, targetLanguage: 'de' }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      originalText: text,
      translatedText: 'übersetzt',
      targetLanguage: 'de',
    });
  });

  it('reports missing server-side DeepL configuration without calling the provider', async () => {
    vi.stubEnv('DEEPL_API_KEY', '');

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );

    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({
      error: 'Translation service is not configured. Add DEEPL_API_KEY on the server.',
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('maps supported languages to DeepL codes and preserves the source text', async () => {
    const originalText = 'Hello, studio.\nPlease keep this line.';
    mocks.fetch.mockResolvedValue(
      deepLResponse({ translations: [{ text: 'Përshëndetje, studio.' }] }),
    );
    vi.stubEnv('DEEPL_API_KEY', 'test-deepl-key:fx');

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
    expect(url).toBe('https://api-free.deepl.com/v2/translate');
    expect(init.headers).toMatchObject({
      Authorization: 'DeepL-Auth-Key test-deepl-key:fx',
    });
    expect(JSON.parse(String(init.body))).toEqual({
      text: [originalText],
      target_lang: 'SQ',
      source_lang: 'EN',
      preserve_formatting: true,
    });
  });

  it('lets DeepL auto-detect the source language when requested', async () => {
    mocks.fetch.mockResolvedValue(
      deepLResponse({ translations: [{ text: 'Hallo' }] }),
    );

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'auto' }),
    );

    expect(response.status).toBe(200);
    const [, init] = mocks.fetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body.target_lang).toBe('DE');
    expect(body).not.toHaveProperty('source_lang');
  });

  it('returns a safe non-500 response when DeepL rejects the request', async () => {
    mocks.fetch.mockResolvedValue(deepLResponse({ message: 'bad key' }, 403));

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de' }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Translation service is unavailable. Please try again.',
    });
  });

  it('returns a timeout response when DeepL does not answer in time', async () => {
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
    await vi.advanceTimersByTimeAsync(DEEPL_REQUEST_TIMEOUT_MS);
    const response = await responsePromise;

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: 'Translation service timed out. Please try again.',
    });
  });
});
