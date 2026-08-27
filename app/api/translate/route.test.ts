import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  authenticate: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock('@/app/api/_lib/auth', () => ({
  getAuthenticatedUser: mocks.authenticate,
}));

import { MYMEMORY_REQUEST_TIMEOUT_MS, POST } from './route';
import { MAX_TRANSLATION_TEXT_LENGTH } from '@/app/api/_lib/text-limits';

function request(body: unknown) {
  return new Request('http://localhost/api/translate', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function myMemoryResponse(
  translatedText: string | undefined,
  status = 200,
  responseStatus = 200,
) {
  return new Response(
    JSON.stringify({
      responseStatus,
      responseData: translatedText === undefined ? {} : { translatedText },
    }),
    { status, headers: { 'content-type': 'application/json' } },
  );
}

describe('POST /api/translate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('MYMEMORY_EMAIL', '');
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

  it('validates fields, language codes, i18n keys, and the shared text limit', async () => {
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

  it('translates an Albanian message with explicit source and target codes', async () => {
    mocks.fetch.mockResolvedValue(myMemoryResponse('Hello, how are you?'));

    const response = await POST(
      request({
        text: 'Përshëndetje, si jeni?',
        targetLanguage: 'en',
        sourceLanguage: 'sq',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      originalText: 'Përshëndetje, si jeni?',
      translatedText: 'Hello, how are you?',
      targetLanguage: 'en',
      sourceLanguage: 'sq',
    });

    const [input] = mocks.fetch.mock.calls[0] as [string | URL];
    const url = new URL(String(input));
    expect(url.origin + url.pathname).toBe('https://api.mymemory.translated.net/get');
    expect(url.searchParams.get('langpair')).toBe('sq|en');
    expect(url.searchParams.get('mt')).toBe('1');
  });

  it('best-effort detects German for the mobile auto source contract', async () => {
    mocks.fetch.mockResolvedValue(myMemoryResponse('Projekti është gati.'));

    const response = await POST(
      request({
        text: 'Hallo, das Projekt ist fertig.',
        targetLanguage: 'sq',
        sourceLanguage: 'auto',
      }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      originalText: 'Hallo, das Projekt ist fertig.',
      translatedText: 'Projekti është gati.',
      targetLanguage: 'sq',
    });
    const [input] = mocks.fetch.mock.calls[0] as [string | URL];
    expect(new URL(String(input)).searchParams.get('langpair')).toBe('de|sq');
  });

  it('best-effort detects English rather than relying on a provider autodetect mode', async () => {
    mocks.fetch.mockResolvedValue(myMemoryResponse('Das Projekt ist bereit.'));

    const response = await POST(
      request({
        text: 'Hello, the project is ready.',
        targetLanguage: 'de',
        sourceLanguage: 'auto',
      }),
    );

    expect(response.status).toBe(200);
    const [input] = mocks.fetch.mock.calls[0] as [string | URL];
    expect(new URL(String(input)).searchParams.get('langpair')).toBe('en|de');
  });

  it('does not block ambiguous auto input by pretending it is English', async () => {
    const response = await POST(
      request({ text: '12345 !!!', targetLanguage: 'de', sourceLanguage: 'auto' }),
    );

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual({
      error: 'Could not determine the source language. Send sourceLanguage as en, sq, or de.',
    });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it('works without a provider key and passes the optional email only when configured', async () => {
    mocks.fetch.mockResolvedValue(myMemoryResponse('Hallo'));
    vi.stubEnv('MYMEMORY_EMAIL', 'translator@example.com');

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'en' }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      originalText: 'Hello',
      translatedText: 'Hallo',
      targetLanguage: 'de',
      sourceLanguage: 'en',
    });
    const [input] = mocks.fetch.mock.calls[0] as [string | URL];
    const url = new URL(String(input));
    expect(url.searchParams.get('de')).toBe('translator@example.com');
    expect(url.searchParams.has('key')).toBe(false);
  });

  it('splits the exact 10,000-character boundary into safe chunks without dropping text', async () => {
    const text = 'x'.repeat(MAX_TRANSLATION_TEXT_LENGTH);
    mocks.fetch.mockImplementation(async (input: string | URL) => {
      const url = new URL(String(input));
      return myMemoryResponse(url.searchParams.get('q') ?? '');
    });

    const response = await POST(
      request({ text, targetLanguage: 'de', sourceLanguage: 'en' }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      originalText: text,
      translatedText: text,
      targetLanguage: 'de',
      sourceLanguage: 'en',
    });
    expect(mocks.fetch.mock.calls.length).toBeGreaterThan(1);
    for (const [input] of mocks.fetch.mock.calls as [string | URL][]) {
      const url = new URL(String(input));
      expect(new TextEncoder().encode(url.searchParams.get('q') ?? '').byteLength).toBeLessThanOrEqual(450);
      expect(url.searchParams.get('mt')).toBe('1');
    }
  });

  it('reassembles sentence and word chunks in order', async () => {
    const text = 'Hello world. '.repeat(100);
    mocks.fetch.mockImplementation(async (input: string | URL) => {
      const url = new URL(String(input));
      return myMemoryResponse(url.searchParams.get('q') ?? '');
    });

    const response = await POST(
      request({ text, targetLanguage: 'de', sourceLanguage: 'en' }),
    );

    expect(response.status).toBe(200);
    expect((await response.json()).translatedText).toBe(text);
    expect(mocks.fetch.mock.calls.length).toBeGreaterThan(1);
  });

  it('returns a safe response when MyMemory has no translated text', async () => {
    mocks.fetch.mockResolvedValue(myMemoryResponse(undefined));

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'en' }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Translation service returned no text. Please try again.',
    });
  });

  it('returns a safe response when MyMemory fails', async () => {
    mocks.fetch.mockResolvedValue(
      myMemoryResponse(undefined, 503, 429),
    );

    const response = await POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'en' }),
    );

    expect(response.status).toBe(502);
    expect(await response.json()).toEqual({
      error: 'Translation service is unavailable. Please try again.',
    });
  });

  it('returns a timeout response when MyMemory does not answer in time', async () => {
    vi.useFakeTimers();
    mocks.fetch.mockImplementation(
      (_input: string | URL, init: RequestInit) =>
        new Promise((_, reject) => {
          init.signal?.addEventListener(
            'abort',
            () => reject(new DOMException('Aborted', 'AbortError')),
            { once: true },
          );
        }),
    );

    const responsePromise = POST(
      request({ text: 'Hello', targetLanguage: 'de', sourceLanguage: 'en' }),
    );
    await Promise.resolve();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(MYMEMORY_REQUEST_TIMEOUT_MS);
    const response = await responsePromise;

    expect(response.status).toBe(504);
    expect(await response.json()).toEqual({
      error: 'Translation service timed out. Please try again.',
    });
  });
});
