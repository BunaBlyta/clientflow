import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/api/_lib/auth';
import { MAX_TRANSLATION_TEXT_LENGTH } from '@/app/api/_lib/text-limits';

export const runtime = 'nodejs';

export const MYMEMORY_REQUEST_TIMEOUT_MS = 10_000;

const MYMEMORY_ENDPOINT = 'https://api.mymemory.translated.net/get';
const MYMEMORY_MAX_CHUNK_BYTES = 450;
const MAX_MYMEMORY_CHUNKS = 80;
const MAX_CONCURRENT_MYMEMORY_REQUESTS = 4;

const LANGUAGE_CODES = {
  en: 'en',
  sq: 'sq',
  de: 'de',
} as const;

const SUPPORTED_LANGUAGES = Object.keys(LANGUAGE_CODES) as SupportedLanguage[];
type SupportedLanguage = keyof typeof LANGUAGE_CODES;
type SourceLanguage = SupportedLanguage | 'auto';

const LANGUAGE_WORDS: Record<SupportedLanguage, ReadonlySet<string>> = {
  en: new Set([
    'and', 'are', 'can', 'could', 'for', 'from', 'hello', 'how', 'is', 'please',
    'project', 'ready', 'send', 'thank', 'thanks', 'the', 'this', 'to', 'we',
    'what', 'with', 'you', 'your',
  ]),
  sq: new Set([
    'dhe', 'do', 'dua', 'eshte', 'është', 'faleminderit', 'kam', 'kjo', 'me',
    'mire', 'mirë', 'nga', 'nje', 'një', 'ne', 'në', 'per', 'për', 'pershendetje',
    'përshëndetje', 'projekti', 'që', 'qe', 'si', 'shenim', 'shënim', 'te', 'të',
    'une', 'unë', 'jeni', 'ju',
  ]),
  de: new Set([
    'aber', 'auch', 'bitte', 'das', 'danke', 'der', 'die', 'ein', 'eine', 'fur',
    'für', 'haben', 'hallo', 'ich', 'ihre', 'ihr', 'ist', 'mit', 'nicht', 'oder',
    'projekt', 'schon', 'sie', 'und', 'von', 'was', 'wie', 'wir', 'zu',
  ]),
};

const TRANSLATION_KEY_PATTERN =
  /^(common|tabs|home|auth|notes|invoices|checkout|notifications|account|status|ui)\.[A-Za-z0-9_.-]+$/;
const UTF8_ENCODER = new TextEncoder();

type TranslationChunk = {
  text: string;
  prefix: string;
  suffix: string;
};

type ProviderSuccess = { ok: true; text: string };
type ProviderFailure = { ok: false; status: 502 | 504; message: string };
type ProviderResult = ProviderSuccess | ProviderFailure;

function translationError(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    { status, headers: { 'Cache-Control': 'no-store' } },
  );
}

function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(LANGUAGE_CODES, value)
  );
}

function isSourceLanguage(value: unknown): value is SourceLanguage {
  return value === 'auto' || isSupportedLanguage(value);
}

function inferSourceLanguage(text: string): SupportedLanguage | null {
  const scores = SUPPORTED_LANGUAGES.map((language) => ({ language, score: 0 }));
  const words = text.toLowerCase().match(/[a-zà-ž]+/g) ?? [];

  for (const word of words) {
    for (const result of scores) {
      if (LANGUAGE_WORDS[result.language].has(word)) result.score += 3;
    }
  }

  if (/[ëç]/i.test(text)) scores.find(({ language }) => language === 'sq')!.score += 5;
  if (/[äöüß]/i.test(text)) scores.find(({ language }) => language === 'de')!.score += 5;

  scores.sort((a, b) => b.score - a.score);
  const [best, runnerUp] = scores;
  if (!best || best.score === 0 || best.score - (runnerUp?.score ?? 0) < 2) {
    return null;
  }
  return best.language;
}

function utf8ByteLength(value: string) {
  return UTF8_ENCODER.encode(value).byteLength;
}

function isWhitespace(character: string | undefined) {
  return Boolean(character && /\s/u.test(character));
}

function maxChunkEnd(text: string, start: number) {
  let end = start;
  let bytes = 0;

  for (const character of text.slice(start)) {
    const characterBytes = utf8ByteLength(character);
    if (bytes + characterBytes > MYMEMORY_MAX_CHUNK_BYTES) break;
    bytes += characterBytes;
    end += character.length;
  }

  return end;
}

function preferredChunkCut(text: string, start: number, maxEnd: number) {
  let sentenceCut = 0;
  for (let index = start; index < maxEnd; index += 1) {
    if (
      '.!?。！？'.includes(text[index] ?? '') &&
      (index + 1 === text.length || isWhitespace(text[index + 1]))
    ) {
      sentenceCut = index + 1;
    }
  }
  if (sentenceCut > start) return sentenceCut;

  for (let index = maxEnd - 1; index > start; index -= 1) {
    if (isWhitespace(text[index])) return index;
  }
  return maxEnd;
}

function splitForMyMemory(text: string): TranslationChunk[] {
  const chunks: TranslationChunk[] = [];
  let cursor = 0;
  let prefix = '';

  while (cursor < text.length) {
    let contentStart = cursor;
    while (contentStart < text.length && isWhitespace(text[contentStart])) {
      contentStart += 1;
    }
    prefix += text.slice(cursor, contentStart);
    cursor = contentStart;
    if (cursor >= text.length) {
      if (chunks.length) chunks[chunks.length - 1].suffix += prefix;
      break;
    }

    const maxEnd = maxChunkEnd(text, cursor);
    if (maxEnd === text.length) {
      let contentEnd = text.length;
      while (contentEnd > cursor && isWhitespace(text[contentEnd - 1])) contentEnd -= 1;
      chunks.push({
        text: text.slice(cursor, contentEnd),
        prefix,
        suffix: text.slice(contentEnd),
      });
      break;
    }

    const cut = preferredChunkCut(text, cursor, maxEnd);
    let separatorEnd = cut;
    while (separatorEnd < text.length && isWhitespace(text[separatorEnd])) separatorEnd += 1;
    chunks.push({
      text: text.slice(cursor, cut),
      prefix,
      suffix: text.slice(cut, separatorEnd),
    });
    cursor = separatorEnd;
    prefix = '';
  }

  return chunks;
}

function providerFailure(message: string, status: 502 | 504 = 502): ProviderFailure {
  return { ok: false, status, message };
}

function providerStatus(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const value = (payload as { responseStatus?: unknown }).responseStatus;
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

function translatedTextFromResponse(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  const responseData = (payload as { responseData?: unknown }).responseData;
  if (!responseData || typeof responseData !== 'object' || Array.isArray(responseData)) return null;
  const text = (responseData as { translatedText?: unknown }).translatedText;
  return typeof text === 'string' && text.trim() ? text.trim() : null;
}

async function translateChunk(
  chunk: TranslationChunk,
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  email: string | undefined,
): Promise<ProviderResult> {
  const url = new URL(MYMEMORY_ENDPOINT);
  url.searchParams.set('q', chunk.text);
  url.searchParams.set(
    'langpair',
    `${LANGUAGE_CODES[sourceLanguage]}|${LANGUAGE_CODES[targetLanguage]}`,
  );
  url.searchParams.set('mt', '1');
  if (email) url.searchParams.set('de', email);

  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, MYMEMORY_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) {
      return providerFailure('Translation service is unavailable. Please try again.');
    }

    const payload = await response.json();
    const status = providerStatus(payload);
    if (status !== null && status !== 200) {
      return providerFailure('Translation service is unavailable. Please try again.');
    }

    const translatedText = translatedTextFromResponse(payload);
    if (!translatedText) {
      return providerFailure('Translation service returned no text. Please try again.');
    }
    return { ok: true, text: translatedText };
  } catch {
    return providerFailure(
      timedOut
        ? 'Translation service timed out. Please try again.'
        : 'Translation service is unavailable. Please try again.',
      timedOut ? 504 : 502,
    );
  } finally {
    clearTimeout(timeout);
  }
}

async function translateChunks(
  chunks: TranslationChunk[],
  sourceLanguage: SupportedLanguage,
  targetLanguage: SupportedLanguage,
  email: string | undefined,
): Promise<ProviderSuccess | ProviderFailure> {
  const results = new Array<string | undefined>(chunks.length);
  let nextIndex = 0;
  let failure: ProviderFailure | null = null;

  async function worker() {
    while (!failure) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= chunks.length) return;

      const result = await translateChunk(chunks[index], sourceLanguage, targetLanguage, email);
      if (!result.ok) {
        failure = result;
        return;
      }
      results[index] = result.text;
    }
  }

  const workerCount = Math.min(MAX_CONCURRENT_MYMEMORY_REQUESTS, chunks.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  if (failure) return failure;

  return {
    ok: true as const,
    text: chunks
      .map((chunk, index) => `${chunk.prefix}${results[index] ?? ''}${chunk.suffix}`)
      .join(''),
  };
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
  if (
    TRANSLATION_KEY_PATTERN.test(text.trim()) ||
    'key' in values ||
    'translationKey' in values
  ) {
    return translationError(
      'Only user-entered note or message content can be translated',
      400,
    );
  }

  const targetLanguage = values.targetLanguage;
  if (!isSupportedLanguage(targetLanguage)) {
    return translationError('Target language must be one of: en, sq, de', 400);
  }

  const requestedSourceLanguage = values.sourceLanguage;
  if (
    requestedSourceLanguage !== undefined &&
    !isSourceLanguage(requestedSourceLanguage)
  ) {
    return translationError(
      'Source language must be one of: en, sq, de, or auto',
      400,
    );
  }

  const sourceLanguage =
    requestedSourceLanguage === undefined || requestedSourceLanguage === 'auto'
      ? inferSourceLanguage(text)
      : requestedSourceLanguage;
  if (!sourceLanguage) {
    return translationError(
      'Could not determine the source language. Send sourceLanguage as en, sq, or de.',
      422,
    );
  }

  const chunks = splitForMyMemory(text);
  if (chunks.length === 0 || chunks.length > MAX_MYMEMORY_CHUNKS) {
    return translationError('Translation could not be completed for this text. Please try again.', 502);
  }

  if (sourceLanguage === targetLanguage) {
    return NextResponse.json(
      {
        originalText: text,
        translatedText: text,
        targetLanguage,
        ...(requestedSourceLanguage && requestedSourceLanguage !== 'auto'
          ? { sourceLanguage: requestedSourceLanguage }
          : {}),
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const email = process.env.MYMEMORY_EMAIL?.trim() || undefined;
  const translated = await translateChunks(chunks, sourceLanguage, targetLanguage, email);
  if ('message' in translated) {
    return translationError(translated.message, translated.status);
  }

  return NextResponse.json(
    {
      originalText: text,
      translatedText: translated.text,
      targetLanguage,
      ...(requestedSourceLanguage && requestedSourceLanguage !== 'auto'
        ? { sourceLanguage: requestedSourceLanguage }
        : {}),
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
