export async function patchJson<T>(
  url: string,
  body: Record<string, unknown>,
  fallbackError: string,
): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const payload = (await response.json().catch(() => null)) as { error?: unknown } | T | null;

  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? payload.error
        : fallbackError;
    throw new Error(message);
  }

  if (!payload || typeof payload !== "object") {
    throw new Error(fallbackError);
  }

  return payload as T;
}
