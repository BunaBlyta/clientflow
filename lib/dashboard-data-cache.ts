import { fetchJson } from "@/lib/fetch-json";

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { expiresAt: number; promise: Promise<unknown> }>();

export function fetchDashboardData<T>(url: string, fallbackError: string): Promise<T> {
  const now = Date.now();
  const existing = cache.get(url);
  if (existing && existing.expiresAt > now) return existing.promise as Promise<T>;

  const promise = fetchJson<T>(url, fallbackError).catch((error) => {
    cache.delete(url);
    throw error;
  });
  cache.set(url, { expiresAt: now + CACHE_TTL_MS, promise });
  return promise;
}

export function invalidateDashboardData(url?: string) {
  if (url) cache.delete(url);
  else cache.clear();
}
