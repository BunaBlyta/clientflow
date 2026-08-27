import { useEffect, useState } from 'react';
import { translateContentRequest } from './api';
import type { Language } from './i18n';

const MAX_CACHE_ENTRIES = 200;
const FAILURE_COOLDOWN_MS = 30_000;

const translationCache = new Map<string, string>();
const inFlightTranslations = new Map<string, Promise<string | null>>();
const failedTranslations = new Map<string, number>();

const INTERNAL_TRANSLATION_KEY = /^(common|tabs|home|auth|notes|invoices|checkout|notifications|account|status|ui)\.[A-Za-z0-9_.-]+$/;

function isInternalTranslationKey(content: string) {
  return INTERNAL_TRANSLATION_KEY.test(content.trim());
}

function cacheKey(content: string, language: Language) {
  return `${language}\u0000${content}`;
}

function cacheTranslation(key: string, translation: string) {
  if (translationCache.size >= MAX_CACHE_ENTRIES && !translationCache.has(key)) {
    const oldestKey = translationCache.keys().next().value;
    if (oldestKey) translationCache.delete(oldestKey);
  }
  translationCache.set(key, translation);
}

/**
 * Translate human-authored content without making the caller wait for the
 * provider. Requests are shared by content/language, successful results are
 * kept in memory, and short-lived failures avoid a request storm when the
 * provider is unavailable.
 */
export function translateUserContent(
  content: string,
  language: Language,
  token: string,
): Promise<string | null> {
  const key = cacheKey(content, language);
  if (!content.trim() || isInternalTranslationKey(content)) return Promise.resolve(null);
  const cached = translationCache.get(key);
  if (cached !== undefined) return Promise.resolve(cached);

  const existing = inFlightTranslations.get(key);
  if (existing) return existing;

  const failedUntil = failedTranslations.get(key) ?? 0;
  if (failedUntil > Date.now()) return Promise.resolve(null);

  const pending = translateContentRequest(content, language, token)
    .then(({ translatedText }) => {
      const translation = translatedText.trim();
      if (!translation) return null;
      cacheTranslation(key, translation);
      failedTranslations.delete(key);
      return translation;
    })
    .catch(() => {
      failedTranslations.set(key, Date.now() + FAILURE_COOLDOWN_MS);
      return null;
    })
    .finally(() => {
      inFlightTranslations.delete(key);
    });

  inFlightTranslations.set(key, pending);
  return pending;
}

/**
 * Return the original content immediately and replace it only after a
 * successful translation. This hook intentionally has no loading/error state:
 * a translation provider outage must never block or destabilize the note feed.
 */
export function useTranslatedUserContent(
  content: string,
  language: Language,
  token: string | null,
  enabled = true,
) {
  const [displayedContent, setDisplayedContent] = useState(content);

  useEffect(() => {
    let active = true;
    setDisplayedContent(content);

    if (!enabled || !content.trim() || isInternalTranslationKey(content) || !token) return () => {
      active = false;
    };

    const key = cacheKey(content, language);
    const cached = translationCache.get(key);
    if (cached !== undefined) {
      setDisplayedContent(cached);
      return () => {
        active = false;
      };
    }

    void translateUserContent(content, language, token).then((translated) => {
      if (active && translated) setDisplayedContent(translated);
    });

    return () => {
      active = false;
    };
  }, [content, enabled, language, token]);

  return displayedContent;
}
