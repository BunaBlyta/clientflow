import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { MAX_TRANSLATION_TEXT_LENGTH } from '@/app/api/_lib/text-limits';

export const runtime = 'nodejs';

export const GOOGLE_TRANSLATE_REQUEST_TIMEOUT_MS = 10_000;

const GOOGLE_TRANSLATE_ENDPOINT =
  'https://translation.googleapis.com/language/translate/v2';

const GOOGLE_LANGUAGE_CODES = {
  en: 'en',
  sq: 'sq',
  de: 'de',
} as const;

type SupportedLanguage = keyof typeof GOOGLE_LANGUAGE_CODES;
type SourceLanguage = SupportedLanguage | 'auto';

const INTERNAL_TRANSLATION_KEY =
  /^(common|tabs|home|auth|notes|invoices|checkout|notifications|account|status|ui)\.[A-Za-z0-9_.-]+$/;

function translationError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(GOOGLE_LANGUAGE_CODES, value)
  );
}

function isSourceLanguage(value: unknown): value is SourceLanguage {
  return value === 'auto' || isSupportedLanguage(value);
}

function isTranslationKey(value: string) {
  return INTERNAL_TRANSLATION_KEY.test(value.trim());
}

function translatedTextFromResponse(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;

  const translations = (data as { translations?: unknown }).translations;
  if (!Array.isArray(translations)) return null;

  const firstTranslation = translations[0];
  if (
    !firstTranslation ||
    typeof firstTranslation !== 'object' ||
    Array.isArray(firstTranslation)
  ) {
    return null;
  }

  const text = (firstTranslation as { translatedText?: unknown }).translatedText;
  if (typeof text !== 'string' || !text.trim()) return null;
  return text.trim();
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request);
  if (!user) return translationError('Authentication required', 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return translationError('Request body must be valid JSON', 400);
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return translationError('Request body must be an object', 400);
  }

  const values = body as Record<string, unknown>;
  const text = values.text;
  if (typeof text !== 'string' || !text.trim()) {
    return translationError('Text is required and must be a non-empty string', 400);
  }
  if (text.length > MAX_TRANSLATION_TEXT_LENGTH) {
    return translationError(
      `Text must be ${MAX_TRANSLATION_TEXT_LENGTH.toLocaleString()} characters or fewer`,
      400,
    );
  }
  if (isTranslationKey(text) || 'key' in values || 'translationKey' in values) {
    return translationError(
      'Only user-entered note or message content can be translated',
      400,
    );
  }

  const targetLanguage = values.targetLanguage;
  if (!isSupportedLanguage(targetLanguage)) {
    return translationError('Target language must be one of: en, sq, de', 400);
  }

  const sourceLanguage = values.sourceLanguage;
  if (sourceLanguage !== undefined && !isSourceLanguage(sourceLanguage)) {
    return translationError(
      'Source language must be one of: en, sq, de, or auto',
      400,
    );
  }

  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!apiKey) {
    return translationError(
      'Translation service is not configured. Add GOOGLE_TRANSLATE_API_KEY on the server.',
      503,
    );
  }

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, GOOGLE_TRANSLATE_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(GOOGLE_TRANSLATE_ENDPOINT, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        q: [text],
        target: GOOGLE_LANGUAGE_CODES[targetLanguage],
        ...(sourceLanguage && sourceLanguage !== 'auto'
          ? { source: GOOGLE_LANGUAGE_CODES[sourceLanguage] }
          : {}),
        format: 'text',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      return translationError('Translation service is unavailable. Please try again.', 502);
    }

    const payload = await response.json();
    const translatedText = translatedTextFromResponse(payload);
    if (!translatedText) {
      return translationError('Translation service returned no text. Please try again.', 502);
    }

    return NextResponse.json(
      {
        originalText: text,
        translatedText,
        targetLanguage,
        ...(sourceLanguage && sourceLanguage !== 'auto'
          ? { sourceLanguage }
          : {}),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return translationError(
      timedOut
        ? 'Translation service timed out. Please try again.'
        : 'Translation service is unavailable. Please try again.',
      timedOut ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}
