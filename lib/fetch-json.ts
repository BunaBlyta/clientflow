export async function fetchJson<T>(
  url: string,
  fallbackError: string,
  signal?: AbortSignal,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    cache: "no-store",
    signal,
  });
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallbackError;
    throw new Error(message);
  }

  if (payload === null || typeof payload !== "object") {
    throw new Error(fallbackError);
  }

  return payload as T;
}
