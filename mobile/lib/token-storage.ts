const TOKEN_KEY = 'clientflow.session.token';
const CLIENT_KEY = 'clientflow.session.client';

function getStorage(): Storage | null {
  if (typeof globalThis === 'undefined' || !('localStorage' in globalThis)) {
    return null;
  }
  return globalThis.localStorage;
}

export function readSession() {
  const storage = getStorage();
  if (!storage) return null;

  const token = storage.getItem(TOKEN_KEY);
  const clientJson = storage.getItem(CLIENT_KEY);
  if (!token || !clientJson) return null;

  try {
    return { token, client: JSON.parse(clientJson) };
  } catch {
    clearSession();
    return null;
  }
}

export function writeSession(token: string, client: unknown) {
  getStorage()?.setItem(TOKEN_KEY, token);
  getStorage()?.setItem(CLIENT_KEY, JSON.stringify(client));
}

export function clearSession() {
  getStorage()?.removeItem(TOKEN_KEY);
  getStorage()?.removeItem(CLIENT_KEY);
}
